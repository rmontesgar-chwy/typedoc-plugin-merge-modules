import { Application, Context, Converter, ProjectReflection, Reflection } from "typedoc";
import * as ts from "typescript";
import { ModuleMerger } from "./merger/module_merger";
import { ProjectMerger } from "./merger/project_merger";
import { PluginOptions } from "./plugin_options";

/**
 * The "Merge Modules" plugin.
 *
 * # What does it do?
 *
 * This plugin merges the content of modules.
 */
export class Plugin {
    /** The options of the plugin. */
    private readonly options = new PluginOptions();

    /**
     * Returns if the plugin is enabled.
     * @returns True if the plugin is enabled, otherwise false.
     */
    public get isEnabled(): boolean {
        return this.options.mode !== "off";
    }

    /**
     * Initializes the plugin.
     * @param typedoc The TypeDoc application.
     */
    public initialize(typedoc: Readonly<Application>): void {
        this.options.addToApplication(typedoc);
        this.subscribeToApplicationEvents(typedoc);
    }

    /**
     * Subscribes to events of the application so that the plugin can do its work
     * in the particular doc generation phases.
     * @param typedoc The TypeDoc application.
     */
    private subscribeToApplicationEvents(typedoc: Readonly<Application>): void {
        typedoc.converter.on(Converter.EVENT_BEGIN, (c: Readonly<Context>) => this.onConverterBegin(c));
        typedoc.converter.on(
            Converter.EVENT_CREATE_DECLARATION,
            (c: Readonly<Context>, r: Reflection, n?: Readonly<ts.Node>) => this.onConverterCreateDeclaration(c, r, n),
        );
        typedoc.converter.on(Converter.EVENT_RESOLVE_BEGIN, (c: Readonly<Context>) => this.onConverterResolveBegin(c));
    }

    /**
     * Triggered when the converter begins converting a project.
     * @param context Describes the current state the converter is in.
     */
    public onConverterBegin(context: Readonly<Context>): void {
        this.options.readValuesFromApplication(context.converter.owner);
    }

    /**
     * Triggered when the converter has created a declaration reflection.
     * @param _context Describes the current state the converter is in.
     * @param reflection The reflection that has been created.
     * @param node The triggering TypeScript node if available.
     */
    public onConverterCreateDeclaration(
        _context: Readonly<Context>,
        reflection: Reflection,
        node?: Readonly<ts.Node>,
    ): void {
        if (
            this.isEnabled &&
            this.options.renameDefaults &&
            reflection.name === "default" &&
            node &&
            (ts.isVariableDeclaration(node) ||
                ts.isFunctionDeclaration(node) ||
                ts.isClassDeclaration(node) ||
                ts.isInterfaceDeclaration(node)) &&
            node.name
        ) {
            reflection.name = node.name.getText();
        }
    }

    /**
     * Triggered when the TypeDoc converter begins resolving a project.
     * @param context Describes the current state the converter is in.
     */
    public onConverterResolveBegin(context: Readonly<Context>): void {
        if (this.isEnabled) {
            this.createMerger(context.project)?.execute();
        }
    }

    /**
     * Creates a merger object for the given project.
     * @param project The project on which the merger should operate.
     * @returns The merger object, or undefined if the plugin is turned off.
     */
    private createMerger(project: ProjectReflection): ProjectMerger | ModuleMerger | undefined {
        if (this.options.mode === "project") {
            return new ProjectMerger(project);
        } else if (this.options.mode === "module") {
            return new ModuleMerger(project);
        }

        return undefined;
    }
}
