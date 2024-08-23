import { createArrayTypechecker, createTypechekerFromExample, OptionalField } from "../../util/helpers";

export { PortfolioCard } from "./Card";

export interface PortfolioSummary {
    id: number,
    created_at: number,
    published_at?: number,
    slug: string,
    title: string,
    subtitle: string,
    author: string,
}

export interface Portfolio extends PortfolioSummary {
    categories: {
        id: number,
        portfolio_id: number,
        title: string,
        work_slugs: string[],
    }[],
}

export const typecheckPortfolio: (value: unknown) => Portfolio = createTypechekerFromExample({
    id: 0,
    created_at: 0,
    published_at: new OptionalField(0),
    slug: "",
    title: "",
    subtitle: "",
    author: "",
    categories: [{
        id: 0,
        portfolio_id: 0,
        title: "",
        work_slugs: [""],
    }],
}, "portfolio");

export const typecheckPortfolioArray: (value: unknown) => Portfolio[] = createArrayTypechecker(typecheckPortfolio, "portfolios");

export const typecheckPortfolioSummary: (value: unknown) => PortfolioSummary = createTypechekerFromExample({
    id: 0,
    created_at: 0,
    published_at: new OptionalField(0),
    slug: "",
    title: "",
    subtitle: "",
    author: "",
}, "portfolio_summary");

export const typecheckPortfolioSummaryArray: (value: unknown) => PortfolioSummary[] = createArrayTypechecker(typecheckPortfolioSummary, "portfolio_summaries");
