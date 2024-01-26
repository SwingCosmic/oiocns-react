import { ReportTreeTypes } from '@/ts/base/schema';
import { schema } from '../../../base';
import { IDirectory } from '../directory';
import { IStandardFileInfo, StandardFileInfo } from '../fileinfo';
export interface IReportTree extends IStandardFileInfo<schema.XReportTree> {
  
}

export const treeTypeNames: Record<ReportTreeTypes, string> = {
  [ReportTreeTypes.Normal]: '普通树',
  [ReportTreeTypes.Summary]: '汇总树',
  [ReportTreeTypes.Financial]: '财务合并树',
}

export class ReportTree extends StandardFileInfo<schema.XReportTree> implements IReportTree {
  constructor(_metadata: schema.XReportTree, _directory: IDirectory) {
    super(
      {
        ..._metadata, typeName: '报表树',
      },
      _directory,
      _directory.resource.reportTreeColl,
    );
  }

  get cacheFlag(): string {
    return 'reporttrees';
  }
  get groupTags(): string[] {
    return [treeTypeNames[this.metadata.treeType], ...super.groupTags];
  }

  override async copy(destination: IDirectory): Promise<boolean> {
    if (this.allowCopy(destination)) {
      return await super.copyTo(destination.id, destination.resource.reportTreeColl);
    }
    return false;
  }
  override async move(destination: IDirectory): Promise<boolean> {
    if (this.allowMove(destination)) {
      return await super.moveTo(destination.id, destination.resource.reportTreeColl);
    }
    return false;
  }
}
