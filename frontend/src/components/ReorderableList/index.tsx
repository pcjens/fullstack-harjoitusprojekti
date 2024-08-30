import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { ReorderableElement } from "./ReorderableElement";

interface Props<T> {
    elements: T[],
    setElements: Dispatch<SetStateAction<T[]>>,
    getKey: (element: T) => string,
    Render: (props: { element: T }) => JSX.Element,
    RenderLast?: () => JSX.Element,
    className?: string
    elementClassName?: string,
}

export function ReorderableList<T>({ elements, setElements, getKey, Render, RenderLast, className, elementClassName }: Props<T>) {
    const [hoverTarget, setHoverTarget] = useState<number>(-1);

    const indicateReposition = useCallback((dragId: string, insertBeforeDragId: string) => {
        if (dragId === insertBeforeDragId) {
            setHoverTarget(-1);
            return;
        }
        const movedIndex = elements.findIndex((e) => getKey(e) === dragId);
        let insertIndex = elements.findIndex((e) => getKey(e) === insertBeforeDragId);
        if (insertIndex > movedIndex) {
            insertIndex++;
        }
        setHoverTarget(insertIndex);
    }, [elements, getKey]);

    const reposition = useCallback((dragId: string, insertBeforeDragId: string) => {
        if (dragId === insertBeforeDragId) {
            return;
        }
        const movedIndex = elements.findIndex((e) => getKey(e) === dragId);
        const newElements = [...elements.slice(0, movedIndex), ...elements.slice(movedIndex + 1)];
        let insertIndex = newElements.findIndex((e) => getKey(e) === insertBeforeDragId);
        if (insertIndex >= movedIndex) {
            insertIndex++;
        }
        setElements([
            ...newElements.slice(0, insertIndex),
            elements[movedIndex],
            ...newElements.slice(insertIndex)
        ]);
        setHoverTarget(-1);
    }, [elements, getKey, setElements]);

    return (
        <div className={className}>
            {elements.map((element, i) => (
                <div key={getKey(element)}
                    className={`d-flex flex-row p-2 ${elementClassName ?? ""}`}
                    style={{
                        borderLeft: "2px solid " + (hoverTarget === i ? "var(--bs-primary)" : "rgba(0, 0, 0, 0)"),
                        borderRight: "2px solid "
                            + ((hoverTarget === elements.length && i === elements.length - 1)
                                ? "var(--bs-primary)" : "rgba(0, 0, 0, 0)"),
                    }}>
                    <ReorderableElement element={element} Render={Render} dragId={getKey(element)}
                        reposition={reposition} indicateReposition={indicateReposition} />
                </div>
            ))}
            {RenderLast && (
                <div className="p-2">
                    <RenderLast />
                </div>
            )}
        </div>
    );
}
