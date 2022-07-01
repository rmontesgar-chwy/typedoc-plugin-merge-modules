/* eslint-disable @typescript-eslint/no-unsafe-call */
import { DeclarationReflection, ProjectReflection } from "typedoc";
import { removeTagFromCommentsOf } from "./utils";

/**
 * Name of the comment tag that can be used to mark a module as the target module within the bundle.
 * The target module is the one into which all the modules of the bundle are merged.
 */
const targetModuleCommentTagName = "@mergeTarget";

/**
 * Class representing a group of modules.
 */
export class ModuleBundle {
    /** The name of the module bundle. */
    private readonly name: string;

    /** The project in which all modules are in. */
    private readonly project: ProjectReflection;

    /** The modules of the bundle. */
    private readonly modules = new Array<DeclarationReflection>();

    /**
     * Creates a new module bundle instance.
     * @param name The name of the module bundle.
     * @param project The project in which all modules are in.
     */
    public constructor(name: string, project: ProjectReflection) {
        this.name = name;
        this.project = project;
    }

    /**
     * Adds a module to the bundle.
     * @param module The module to add.
     */
    public add(module: DeclarationReflection): void {
        this.modules.push(module);
    }

    /**
     * Merges the modules of the bundle into one module.
     */
    public merge(): void {
        const childrenOfAllModules = this.modules
            .map((m) => m.children)
            .filter((m): m is DeclarationReflection[] => m !== undefined)
            .reduce((acc, val) => acc.concat(val), []);

        // get target module
        const targetModule = this.getTargetModule();
        removeTagFromCommentsOf(targetModule, targetModuleCommentTagName);

        // set target module for all children
        childrenOfAllModules.forEach((child) => (child.parent = targetModule));
        targetModule.children = childrenOfAllModules;

        // remove rest modules
        this.modules.forEach((module) => {
            if (module !== targetModule) {
                delete module.children;
                this.project.removeReflection(module);
            }
        });
    }

    /**
     * Returns the module from the bundle that should be used as the target module.
     * @returns The target module.
     */
    private getTargetModule(): DeclarationReflection {
        // 1. search for the first module which is marked with a specific tag
        const firstModuleWithTargetTag = this.modules.find(
            (module) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                const coments = module.comment === undefined ? { blockTags: [] } : module.comment;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                return coments.blockTags.filter(
                    (tagObj: { tag: string; }) => tagObj.tag.toLowerCase() === targetModuleCommentTagName.toLowerCase()
                ).length > 0
            }
        );

        if (firstModuleWithTargetTag) {
            return firstModuleWithTargetTag;
        }

        // 2. search for the first module with a comment
        const firstModuleWithComment = this.modules.find((module) => module.comment?.summary);

        if (firstModuleWithComment) {
            return firstModuleWithComment;
        }

        // 3. default: pick the first module
        return this.modules[0];
    }
}
