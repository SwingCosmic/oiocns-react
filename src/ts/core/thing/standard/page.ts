import { Command, schema } from '@/ts/base';
import { IDirectory } from '../directory';
import { IStandardFileInfo, StandardFileInfo } from '../fileinfo';
import { ISpecies, Species } from './species';

export interface IPageTemplate extends IStandardFileInfo<schema.XPageTemplate> {
  /** 触发器 */
  command: Command;
  /** 分类 */
  species: ISpecies[];
  /** 加载分类 */
  loadSpecies: (speciesIds: string[]) => Promise<ISpecies[]>;
}

export class PageTemplate
  extends StandardFileInfo<schema.XPageTemplate>
  implements IPageTemplate
{
  constructor(_metadata: schema.XPageTemplate, _directory: IDirectory) {
    super(_metadata, _directory, _directory.resource.templateColl);
    this.command = new Command();
  }
  canDesign: boolean = true;
  command: Command;
  species: ISpecies[] = [];
  get cacheFlag() {
    return 'pages';
  }
  async copy(destination: IDirectory): Promise<boolean> {
    if (this.allowCopy(destination)) {
      return await super.copyTo(destination.id, destination.resource.templateColl);
    }
    return false;
  }
  async move(destination: IDirectory): Promise<boolean> {
    if (this.allowMove(destination)) {
      return await super.moveTo(destination.id, destination.resource.templateColl);
    }
    return false;
  }
  async loadSpecies(speciesIds: string[]): Promise<ISpecies[]> {
    const already = this.species.map((item) => item.id);
    const filter = speciesIds.filter((speciesId) => !already.includes(speciesId));
    if (filter.length > 0) {
      const species = await this.directory.resource.speciesColl.find(filter);
      for (const item of species) {
        const meta = new Species(item, this.directory);
        await meta.loadContent();
        this.species.push(meta);
      }
    }
    const result: ISpecies[] = [];
    speciesIds.forEach((speciesId) => {
      const item = this.species.find((one) => one.id == speciesId);
      if (item) {
        result.push(item);
      }
    });
    return result;
  }
}
