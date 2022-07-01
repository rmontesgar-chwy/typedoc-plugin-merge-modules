/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { DeclarationReflection } from "typedoc";

/**
 * Removes a possible tag from the comments of the given reflection.
 * @param reflection The reflection from which the tag should be removed.
 * @param tagToRemove Name of the tag to be removed.
 */
export function removeTagFromCommentsOf(reflection: DeclarationReflection, tagToRemove: string): void {
    tagToRemove = tagToRemove.toLowerCase();

    const tagIndex = reflection.comment?.blockTags.reduce(
        (targetIndex: number, tagObj: { tag: string; }, tagId: number) => {
            return tagObj.tag.toLowerCase() === tagToRemove ? tagId : targetIndex;
        },
    -1) ?? -1;

    if (tagIndex !== -1) {
        reflection.comment?.blockTags.splice(tagIndex, 1);
    }
}
