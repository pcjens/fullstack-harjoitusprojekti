import { createArrayTypechecker, createTypechekerFromExample, OptionalField } from "../../util/helpers";

export { PortfolioCard } from "./Card";

export interface Portfolio {
    created_at: number,
    published_at?: number,
    slug: string,
    title: string,
    subtitle: string,
    author: string,
}

export const typecheckPortfolio = createTypechekerFromExample({
    id: 0,
    created_at: 0,
    published_at: new OptionalField(0),
    slug: "",
    title: "",
    subtitle: "",
    author: "",
}, "portfolio");

export const typecheckPortfolioArray = createArrayTypechecker(typecheckPortfolio, "portfolios");
