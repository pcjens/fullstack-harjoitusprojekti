import { createArrayTypechecker, createTypechekerFromExample, OptionalField } from "../../util/helpers";

export { WorkListing } from "./Listing";

export interface Work {
    id: number,
    slug: string,
    title: string,
    short_description: string,
    long_description: string,
    attachments: {
        id: number,
        work_id: number,
        attachment_kind: string,
        content_type: string,
        title?: string,
        bytes_base64: string,
    }[],
    links: {
        id: number,
        work_id: number,
        title: string,
        href: string,
    }[],
    tags: {
        id: number,
        work_id: number,
        tag: string,
    }[],
}

export const typecheckWork: (value: unknown) => Work = createTypechekerFromExample({
    id: 0,
    slug: "",
    title: "",
    short_description: "",
    long_description: "",
    attachments: [{
        id: 0,
        work_id: 0,
        attachment_kind: "",
        content_type: "",
        title: new OptionalField(""),
        bytes_base64: "",
    }],
    links: [{
        id: 0,
        work_id: 0,
        title: "",
        href: "",
    }],
    tags: [{
        id: 0,
        work_id: 0,
        tag: "",
    }],
}, "work");

export const typecheckWorkArray: (value: unknown) => Work[] = createArrayTypechecker(typecheckWork, "works");
