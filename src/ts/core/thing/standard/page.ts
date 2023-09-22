import { schema } from '@/ts/base';
import { IStandardFileInfo, StandardFileInfo } from '../fileinfo';
import { IDirectory } from '../directory';

export interface IPageTemplate extends IStandardFileInfo<schema.XPageTemplate> {
  /** 设置数据 */
  setContent(data: string): Promise<void>;
  /** 获取数据 */
  getContent(): string;
}

export class PageTemplate
  extends StandardFileInfo<schema.XPageTemplate>
  implements IPageTemplate
{
  constructor(_metadata: schema.XPageTemplate, _directory: IDirectory) {
    super(_metadata, _directory, _directory.resource.templateColl);
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
  async setContent(data: string): Promise<void> {
    this.metadata.data = data;
    await super.update(this.metadata);
  }
  getContent(): string {
    return this.metadata.data;
  }
}
