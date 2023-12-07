import { model, schema } from '@/ts/base';
import { IDirectory } from '../thing/directory';
import { FileInfo, IFileInfo } from '../thing/fileinfo';
import { IApplication } from '../thing/standard/application';
import { Form, IForm } from '../thing/standard/form';
import { entityOperates, fileOperates } from '../public';

// 数据领用
export interface IAcquire extends IFileInfo<schema.XAcquire> {
  /** 应用 */
  application: IApplication;
  /** 元数据 */
  metadata: schema.XAcquire;
  /** 表单 */
  forms: IForm[];
  /** 更新数据领用 */
  update(data: schema.XAcquire): Promise<boolean>;
  /** 加载表单 */
  loadForms(reload?: boolean): Promise<IForm[]>;
  /** 创建办事 */
  createApply(): Promise<boolean>;
  /** 接收通知 */
  receive(operate: string, data: schema.XAcquire): boolean;
}

export class Acquire extends FileInfo<schema.XAcquire> implements IAcquire {
  constructor(_metadata: schema.XAcquire, _application: IApplication) {
    super(_metadata, _application.directory);
    this._application = _application;
    this._metadata = _metadata;
    this._forms = [];
  }
  _application: IApplication;
  _metadata: schema.XAcquire;
  _forms: IForm[];
  _formLoaded: boolean = false;

  get application(): IApplication {
    return this._application;
  }

  get metadata(): schema.XAcquire {
    return this._metadata;
  }

  get forms(): IForm[] {
    return this._forms;
  }

  get cacheFlag(): string {
    return 'acquire';
  }

  get groupTags(): string[] {
    return [];
  }

  async loadContent(reload?: boolean): Promise<boolean> {
    await this.loadForms(reload);
    return true;
  }

  async copy(destination: IDirectory): Promise<boolean> {
    if (destination.id != this.application.id) {
      if ('acquires' in destination) {
        const app = destination as unknown as IApplication;
        const res = await app.createAcquire({
          ...this.metadata,
          applicationId: app.id,
        });
        return res != undefined;
      }
    }
    return false;
  }

  async rename(_name: string): Promise<boolean> {
    return await this.update({
      ...this.metadata,
      name: _name,
    });
  }

  async move(destination: IDirectory): Promise<boolean> {
    if (
      destination.id != this.directory.id &&
      destination.metadata.belongId === this.application.metadata.belongId
    ) {
      if ('acquires' in destination) {
        const app = destination as unknown as IApplication;
        this.setMetadata({ ...this.metadata, applicationId: app.id });
        const success = await this.directory.resource.acquireColl.update(this.id, {
          _set_: { applicationId: app.id },
        });
        if (success) {
          this._application = app;
          app.acquires.push(this);
          app.changCallback();
          return await this.notify('acquireRemove', this.metadata);
        } else {
          this.setMetadata({ ...this.metadata, applicationId: this.application.id });
        }
      }
    }
    return false;
  }

  async update(data: schema.XAcquire): Promise<boolean> {
    data.id = this.id;
    data.applicationId = this.metadata.applicationId;
    const res = await this.directory.resource.acquireColl.replace(data);
    if (res) {
      return this.notify('acquireReplace', res);
    }
    return false;
  }

  async hardDelete(): Promise<boolean> {
    if (this.directory) {
      const res = await this.directory.resource.acquireColl.remove(this.metadata);
      if (res) {
        this.application.acquires = this.application.acquires.filter(
          (a) => a.id != this.id,
        );
        return await this.notify('acquireRemove', this.metadata);
      }
    }
    return false;
  }

  async delete(): Promise<boolean> {
    return await this.hardDelete();
  }

  async loadForms(reload?: boolean | undefined): Promise<IForm[]> {
    if (!this._formLoaded && reload) {
      const formIds = this.metadata.forms.map((item) => item.id);
      const forms = await this.directory.resource.formColl.load({
        options: { match: { id: { _in_: formIds } } },
      });
      this._forms = forms.map((item) => new Form(item, this.directory));
      return this._forms;
    }
    return [];
  }

  async notify(operate: string, data: any): Promise<boolean> {
    return await this.application.notify(operate, {
      ...data,
      typeName: '数据领用',
      parentId: this.application.metadata.id,
      directoryId: this.application.metadata.directoryId,
    });
  }

  override operates(): model.OperateModel[] {
    const operates = super.operates();
    if (operates.includes(entityOperates.Delete)) {
      operates.push(entityOperates.HardDelete);
    }
    return operates
      .filter((i) => i != fileOperates.Copy)
      .filter((i) => i != fileOperates.Move)
      .filter((i) => i != fileOperates.Download)
      .filter((i) => i != entityOperates.Delete);
  }

  async createApply(): Promise<boolean> {
    return false;
  }

  receive(operate: string, data: schema.XAcquire): boolean {
    if (operate === 'acquireReplace' && data && data.id === this.id) {
      data.typeName = '数据领用';
      this.setMetadata(data);
      this.loadContent(true).then(() => {
        this.changCallback();
      });
    }
    return true;
  }
}
