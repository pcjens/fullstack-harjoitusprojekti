import { DragEventHandler } from "react";

import "./ReorderableElement.css";

const GripVertical = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className='bi bi-grip-vertical' viewBox="0 0 16 16" >
        <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0M7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0M7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
    </svg >
);

interface Props<T> {
    element: T,
    Render: (props: { element: T }) => JSX.Element,
    dragId: string,
    reposition: (dragId: string, insertBeforeDragId: string) => void,
    indicateReposition: (dragId: string, insertBeforeDragId: string | null) => void,
}

export function ReorderableElement<T>({ element, Render, dragId, reposition, indicateReposition }: Props<T>) {
    const dragStart: DragEventHandler<HTMLDivElement> = (event) => {
        event.dataTransfer.setData("text/plain", `dragId:${dragId}`);
    };

    const updateDragTarget: DragEventHandler<HTMLDivElement> = (event) => {
        event.preventDefault();
        const data = event.dataTransfer.getData("text/plain");
        if (data.startsWith("dragId:")) {
            const draggedId = data.split(":", 2)[1];
            indicateReposition(draggedId, dragId);
        }
    };

    const clearDragTarget: DragEventHandler<HTMLDivElement> = (event) => {
        event.preventDefault();
        const data = event.dataTransfer.getData("text/plain");
        if (data.startsWith("dragId:")) {
            const draggedId = data.split(":", 2)[1];
            indicateReposition(draggedId, null);
        }
    };

    const drop: DragEventHandler<HTMLDivElement> = (event) => {
        event.preventDefault();
        const data = event.dataTransfer.getData("text/plain");
        if (data.startsWith("dragId:")) {
            const draggedId = data.split(":", 2)[1];
            reposition(draggedId, dragId);
        }
    };

    return (
        <div className="d-inline-flex flex-row m-2 align-items-center" draggable={true} style={{ flexGrow: 1 }}
            onDragStart={dragStart} onDrop={drop} onDragEnter={updateDragTarget} onDragLeave={clearDragTarget} onDragOver={updateDragTarget}>
            <div className="reordering-handle">
                <GripVertical />
            </div>
            <Render element={element} />
        </div>
    );
}
