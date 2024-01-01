import React, { useCallback, useEffect, useState } from "react";
import { defineElement } from "../../defineElement";
import { formatDate, formatNumber } from "@/utils";
import { useEffectOnce } from "react-use";
import { Button, Spin, Table, DatePicker, Breadcrumb } from "antd";
import cls from "./ledger.module.less";
import { ColumnType } from "antd/lib/table";
import { AssetLedgerSummary, postfixMap, prefixMap } from "./ledger";
import testdata from "./testdata";
import { AssetLedgerModal } from "./AssetLedgerModal";
import { RangePicker } from "@/components/Common/StringDatePickers/RangePicker";
import { ExistTypeMeta } from "@/executor/design/pageBuilder/core/ElementMeta";
import { SEntity } from "@/executor/design/pageBuilder/design/config/FileProp";
import { IForm, ISpecies } from "@/ts/core";
import { XSpecies, XSpeciesItem } from "@/ts/base/schema";
import _ from "lodash";

type BreadcrumbItemType = Pick<AssetLedgerSummary, 'assetTypeId' | 'assetTypeName'>;

export default defineElement({
  render(props, ctx) {
    
    const [loading, setLoading] = useState(false);
    const [ready, setReady] = useState(false);
    
    const [month, setMonth] = useState<[string, string]>(['', '']);

    const [data, setData] = useState<AssetLedgerSummary[]>([]);
    const [species, setSpecies] = useState<XSpeciesItem[]>([]);
    const [parentId, setParentId] = useState('');
    const [parentPath, setParentPath] = useState<BreadcrumbItemType[]>([]);

    const [detailVisible, setDetailVisible] = useState(false);
    const [currentRow, setCurrentRow] = useState<AssetLedgerSummary | null>(null);
    const [currentField, setCurrentField] = useState('');
    const [currentType, setCurrentType] = useState('');
    const [form, setForm] = useState<IForm>(null!);

    async function init() {
      const now = new Date();
      let date = formatDate(now, 'yyyy-MM');
      setMonth([date, date]);

      if (!props.species || !props.species.id) {
        console.warn("资产分类id必填");
        return;
      }
      if (!props.form || !props.form.id) {
        console.warn("表单id必填");
        return;
      }

      const data = await ctx.view.pageInfo.loadSpecies([props.species.id]);
      console.log(data)
      setSpecies(data[0].items); 

      const f = await ctx.view.pageInfo.loadForm(props.form.id);
      setForm(f);

      setReady(true);
    }

    async function loadData() {
      if (!month[0] || !month[1] || !ready) {
        return;
      }

      try {
        setLoading(true);

        await new Promise<void>((s) => setTimeout(() => s(), 2000)); 

        let roots: AssetLedgerSummary[] = species
          .filter(s => parentId ? s.parentId == parentId : !s.parentId)
          .map(s => {
            const ret = _.cloneDeep(testdata[_.random(0, testdata.length - 1)]);
            ret.assetTypeId = s.id;
            ret.assetTypeName = s.name;
            ret.belongId = ctx.view.pageInfo.directory.belongId;

            ret.canClick = false;
            ret.isParent = true;

            return ret;
          });
        
        for (const root of [...roots]) {
          const children = species
            .filter(s => s.parentId == root.assetTypeId)
            .map(s => {
              const ret = _.cloneDeep(testdata[_.random(0, testdata.length - 1)]);
              ret.assetTypeId = s.id;
              ret.assetTypeName = s.name;
              ret.belongId = ctx.view.pageInfo.directory.belongId;

              ret.canClick = species.filter(c => c.parentId == s.id).length > 0;
              ret.isParent = false;

              return ret;
            });
          const index = roots.indexOf(root);
          roots.splice(index + 1, 0, ...children);
        }
        
        setData(roots); 

      } finally {
        setLoading(false);
      }

    }

    const handleViewDetail = useCallback(async (row: AssetLedgerSummary, field: string, type: string) => {
      setCurrentRow(row);
      setCurrentField(field);
      setCurrentType(type);

      setDetailVisible(true);
    }, []);
    
    function handleExpand(row: AssetLedgerSummary) {
      if (ctx.view.mode == 'design') {
        return;
      }
      setCurrentRow(row);
      setParentId(row.assetTypeId);

      parentPath.push(_.pick(row, ['assetTypeId', 'assetTypeName']));
      setParentPath(parentPath);
    };

    function handleBack(item?: BreadcrumbItemType) {
      if (ctx.view.mode == 'design') {
        return;
      }

      if (!item) {
        setCurrentRow(null);
        setParentId('');
        setParentPath([]);
        return;
      }

      const row = data.find(d => d.assetTypeId == item.assetTypeId)!;

      setCurrentRow(row);
      setParentId(row.assetTypeId);
      
      parentPath.splice(parentPath.indexOf(item));
      setParentPath(parentPath);
    }

    useEffectOnce(() => { 
      init(); 
    });
    useEffect(() => {
      loadData();
    }, [month, ready, parentId]);
 
    return (
      <div className={cls.assetLedger + " asset-page-element"}>
        <Spin spinning={loading}>
          <div className="flex flex-col gap-2" style={{ height: '100%' }}>
            <div className="asset-page-element__topbar">
              <Breadcrumb>
                <Breadcrumb.Item className={cls.title}>
                  {parentPath.length > 0 ? (
                    <a onClick={() => handleBack()}>全部资产</a>
                  ) : (
                    <span>全部资产</span>
                  )}
                </Breadcrumb.Item>
                {parentPath.map((p) => {
                  return (
                    <Breadcrumb.Item key={p.assetTypeId}>
                      {parentId == p.assetTypeId ? (
                        <span>{p.assetTypeName}</span>
                      ) : (
                        <a onClick={() => handleBack(p)}>{p.assetTypeName}</a>
                      )}
                    </Breadcrumb.Item>
                  );
                })}
              </Breadcrumb>
              <div className="flex-auto"></div>
              <div>月份范围</div>
              <RangePicker
                picker="month"
                value={month}
                onChange={setMonth}
                format="YYYY-MM"
              />
              <Button onClick={loadData}>刷新</Button>
            </div>
            <div className={cls.content}>
              <Table
                sticky
                pagination={false}
                bordered
                size="small"
                dataSource={data}
                scroll={{ y: 'calc(100%)' }}>
                <Table.Column
                  title="资产类别名称"
                  dataIndex="assetTypeName"
                  width="240px"
                  render={(_, row: AssetLedgerSummary) => {
                    if (row.isParent) {
                      return <div className="is-bold">{row.assetTypeName}</div>;
                    } else if (row.canClick) {
                      return (
                        <div
                          className="cell-link"
                          style={{ marginLeft: '8px' }}
                          onClick={() => handleExpand(row)}>
                          {row.assetTypeName}
                        </div>
                      );
                    } else {
                      return <div style={{ marginLeft: '8px' }}>{row.assetTypeName}</div>;
                    }
                  }}
                />
                {postfixMap.map((group) => (
                  <Table.ColumnGroup key={group.postfix} title={group.label}>
                    {prefixMap.map((item) => {
                      const prop = item.prefix + group.postfix;
                      const column: ColumnType<any> = {
                        title: item.label,
                        dataIndex: item.prefix + group.postfix,
                        align: 'right',
                        key: item.prefix,
                      };
                      if (['plus', 'minus'].includes(item.prefix)) {
                        column.render = (_, row) => {
                          return (
                            <div
                              className="cell-link"
                              onClick={() =>
                                handleViewDetail(row, group.postfix, item.prefix)
                              }>
                              {formatNumber(row[prop], 2, true)}
                            </div>
                          );
                        };
                      } else {
                        column.render = (_, row) => {
                          return <div>{formatNumber(row[prop], 2, true)}</div>;
                        };
                      }
                      return <Table.Column {...column} />;
                    })}
                  </Table.ColumnGroup>
                ))}
              </Table>
            </div>
          </div>
        </Spin>

        {detailVisible ? (
          <AssetLedgerModal
            summary={currentRow}
            field={currentField}
            form={form}
            type={currentType}
            visible={detailVisible}
            onVisibleChange={setDetailVisible}
          />
        ) : <></>}
      </div>
    );
  },
  displayName: "AssetLedger",
  meta: {
    props: {
      species: {
        type: 'type',
        label: '资产类别的分类',
        typeName: 'speciesFile',
        required: true,
      } as ExistTypeMeta<SEntity>,
      form: {
        type: 'type',
        label: '资产的表单',
        typeName: 'formFile',
        required: true,
      } as ExistTypeMeta<SEntity>,
    },
    type: 'Element',
    label: '资产总账',
  }
});