export { PortfolioCard } from "./Card";

export interface Portfolio {
    created_at: number,
    published_at?: number,
    slug: string,
    title: string,
    subtitle: string,
    author: string,
}
