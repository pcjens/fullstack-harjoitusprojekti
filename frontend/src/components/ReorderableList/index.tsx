import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { ReorderableElement } from "./ReorderableElement";

const DropIndicator = ({ hovering }: { hovering: boolean }) => {
    return (
        <div style={{
            display: "inline-block",
            position: "relative",
            top: "8px",
            height: "32px",
            borderLeft: "2px solid var(--bs-primary)",
            opacity: hovering ? 1 : 0,
        }}>
        </div>
    );
};

interface Props<T> {
    elements: T[],
    setElements: Dispatch<SetStateAction<T[]>>,
    getKey: (element: T) => string,
    Render: (props: { element: T }) => JSX.Element,
    className: string
}

export function ReorderableList<T>({ elements, setElements, getKey, Render, className }: Props<T>) {
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
            {elements.map((element, i) => <div key={getKey(element)}>
                <DropIndicator hovering={hoverTarget === i} />
                <ReorderableElement element={element} Render={Render} dragId={getKey(element)}
                    reposition={reposition} indicateReposition={indicateReposition} />
            </div>)}
            <DropIndicator hovering={hoverTarget === elements.length} />
        </div>
    );
}
