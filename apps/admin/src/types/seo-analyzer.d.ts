declare module "seo-analyzer" {
  type RuleName = string;

  export default class SeoAnalyzer {
    constructor(options?: { verbose?: boolean });
    inputHTMLStrings(input: { source: string; text: string }[]): this;
    useRule(rule: RuleName, options?: Record<string, unknown>): this;
    addRule(rule: unknown, options?: Record<string, unknown>): this;
    outputObject(cb: (result: unknown) => void): this;
    run(): Promise<void>;
  }
}
