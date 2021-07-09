export interface DocumentConfig {
  title: string;
  has_cover: boolean;
}

export interface PageConfig {
  type: string;
  title: string | null;
  repeat: number | null;
}

export class Config {
  document: DocumentConfig = { title: '', has_cover: false };
  contents: PageConfig[] = []

  constructor({ document, contents }: any) {
    this.document = document;
    this.contents = contents;
  }

  contentsLength() {
    return this.contents.reduce((prev, curr) => {
      if (curr.repeat) {
        return prev + curr.repeat;
      }
      return prev + 1;
    }, 0)
  }
}
