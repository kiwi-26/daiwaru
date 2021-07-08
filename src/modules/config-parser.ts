interface DocumentConfig {
  title: string;
  has_cover: boolean;
}

interface PageConfig {
  type: string;
  title: string | null;
  repeat: number | null;
}

interface Config {
  document: DocumentConfig;
  contents: PageConfig[]
}
