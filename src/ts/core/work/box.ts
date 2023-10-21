import { command, kernel, schema } from '@/ts/base';
import { generateUuid } from '@/ts/base/common';
import { UserProvider } from '..';

// 暂存箱
export interface IBoxProvider {
  // 使用箱子的用户
  provider: UserProvider;
  // 暂存的物品
  stagings: schema.XStaging[];
  // 获取同一类物品
  groups(typeNames: string[]): schema.XStaging[];
  /** 放入物品 */
  createStaging(data: schema.XStaging): Promise<schema.XStaging | undefined>;
  /** 拿出物品 */
  removeStaging(data: schema.XStaging): Promise<boolean>;
  /** 查看所有物品 */
  loadStagings(reload?: boolean): Promise<schema.XStaging[]>;
}

export class BoxProvider implements IBoxProvider {
  constructor(_provider: UserProvider) {
    this.provider = _provider;
    this.key = generateUuid();
    this.coll?.subscribe(
      [this.key],
      (message: { operate: string; data: schema.XStaging[] }) => {
        switch (message.operate) {
          case 'create':
            this.stagings.push(...message.data);
            break;
          case 'delete':
            this.stagings = this.stagings.filter((item) => !message.data.includes(item));
            break;
        }
        command.emitter('stagings', 'refresh');
      },
    );
  }

  key: string;
  provider: UserProvider;
  stagings: schema.XStaging[] = [];
  private _stagingLoaded = false;

  get coll() {
    return this.provider.user?.resource.stagingColl;
  }

  groups(typeNames: string[]): schema.XStaging[] {
    return this.stagings.filter((item) => typeNames.includes(item.typeName));
  }

  async createStaging(data: schema.XStaging): Promise<schema.XStaging | undefined> {
    const res = await this.coll?.insert(data);
    if (res) {
      await this.coll?.notity({ data: [res], operate: 'create' });
      return res;
    }
  }

  async removeStaging(data: schema.XStaging): Promise<boolean> {
    let res = await this.coll?.delete(data);
    if (res) {
      res = await this.coll?.notity({ data: [data], operate: 'delete' });
      return res ?? false;
    }
    return false;
  }

  async loadStagings(reload?: boolean | undefined): Promise<schema.XStaging[]> {
    if (!this._stagingLoaded || reload) {
      let res = await this.coll?.all(reload);
      if (res) {
        this._stagingLoaded = true;
        this.stagings = res;
        await this._loadThings(this.groups(['实体']));
        command.emitter('stagings', 'refresh');
      }
    }
    return this.stagings;
  }

  private async _loadThings(stagings: schema.XStaging[]) {
    const thingIds = stagings.map((item) => item.dataId);
    const relations = new Set(stagings.flatMap((item) => item.relations));
    const res = await kernel.loadThing(this.provider.user!.belongId, [...relations], {
      match: {
        id: {
          _in_: thingIds,
        },
      },
    });
    if (res && res.data) {
      for (const staging of stagings) {
        for (const thing of res.data) {
          staging.data = thing;
        }
      }
    }
    return stagings;
  }
}
