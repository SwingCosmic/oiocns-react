import { common, model, schema } from '@/ts/base';
import { IBelong } from '@/ts/core';
import { Emitter, logger } from '@/ts/base/common';
import React, { useEffect, useRef, useState } from 'react';
import { HotTable } from '@handsontable/react';
import { registerLanguageDictionary, zhCN } from 'handsontable/i18n';
registerLanguageDictionary(zhCN);
import { registerAllModules } from 'handsontable/registry';
registerAllModules();
import { textRenderer, registerRenderer } from 'handsontable/renderers';
import 'handsontable/dist/handsontable.min.css';
import CellItem from './cellItem';
import { getWidget } from '../../WorkForm/Utils';

const WorkReportViewer: React.FC<{
  data: any;
  belong: IBelong;
  form: schema.XForm;
  info?: model.FormInfo;
  readonly?: boolean;
  showTitle?: boolean;
  fields: model.FieldModel[];
  changedFields: model.MappingData[];
  rules: model.RenderRule[];
  formData?: model.FormEditData;
  onValuesChange?: (fieldId: string, value: any, data: any) => void;
}> = (props) => {
  props.data.name = props.form.name;
  const [editMode, setEditMode] = useState<boolean>(false);
  const [notifyEmitter] = React.useState(new Emitter());
  const [cells, setCells] = useState<any>([]);
  const [styleList, setStyleList] = useState<any>([]);
  const [field, setField] = useState<model.FieldModel>(props.fields[0]);
  const [coordinate, setCoordinate] = useState<any>();
  const [stagData, setStagData] = useState<any>([]);
  const [selectValue, setSelectValue] = useState<any>();
  const hotRef: any = useRef(null); // ref
  const onValueChange = (fieldId: string, value: any, refresh: boolean = true) => {
    if (coordinate?.row) {
      setStagData([
        ...stagData,
        { row: coordinate.row, col: coordinate.col, fieldId: fieldId, value: value },
      ]);
    }
    const checkHasChanged = (fieldId: string, value: any) => {
      const oldValue = props.data[fieldId];
      if (oldValue) {
        return value != oldValue || value === undefined || value === null;
      } else {
        return value !== undefined && value !== null;
      }
    };
    const runRule = (key: string) => {
      const vaildRule = (rules: any[]): boolean => {
        var pass: boolean = false;
        if (rules.includes('and') || rules.includes('or')) {
          var operate = 'and';
          var result: boolean[] = [];
          for (const rule of rules) {
            if (Array.isArray(rule)) {
              result.push(vaildRule(rule));
            } else if (['and', 'or'].includes(rule)) {
              operate = rule;
            }
          }
          return operate == 'and' ? !result.includes(false) : result.includes(true);
        } else if (rules.length == 3) {
          const dataValue = props.data[rules[0].replace('T', '')];
          if (dataValue) {
            switch (rules[1]) {
              case '=':
                return dataValue == rules[2];
              case '<>':
                return dataValue != rules[2];
              case '>':
                return dataValue > rules[2];
              case '>=':
                return dataValue >= rules[2];
              case '<':
                return dataValue < rules[2];
              case '<=':
                return dataValue <= rules[2];
              case 'contains':
                return `${dataValue}`.includes(rules[2]);
              case 'notcontains':
                return !`${dataValue}`.includes(rules[2]);
              case 'startswith':
                return `${dataValue}`.startsWith(rules[2]);
              case 'endswith':
                return `${dataValue}`.endsWith(rules[2]);
              case 'isblank':
                return `${dataValue}`.trim().length == 0;
              case 'isnotblank':
                return `${dataValue}`.trim().length > 0;
              case 'between':
                if (Array.isArray(rules[2]) && rules[2].length == 2) {
                  return dataValue > rules[2][0] && dataValue <= rules[2][1];
                }
                break;
              default:
                break;
            }
          }
        } else if (rules.length == 2) {
          switch (rules[1]) {
            case 'isblank':
              return props.data[rules[0]] == undefined;
            case 'isnotblank':
              return props.data[rules[0]] != undefined;
            default:
              break;
          }
        } else if (rules.length == 1) {
          return vaildRule(rules[0]);
        }
        return pass;
      };
      const rules =
        props.form.rule?.filter((a) => a.trigger.find((s) => s.includes(key))) ?? [];
      for (const rule of rules) {
        if ('target' in rule) {
          const target = props.fields.find((a) => a.id == rule.target);
          if (target) {
            switch (rule.type) {
              case 'show':
                {
                  var showRule = rule as model.FormShowRule;
                  var pass = vaildRule(JSON.parse(showRule.condition));
                  const oldRule = props.formData?.rules.find(
                    (a) => a.destId == showRule.target && a.typeName == showRule.showType,
                  );
                  if (oldRule) {
                    let newValue = pass ? showRule.value : !showRule.value;
                    if (oldRule.value != newValue) {
                      oldRule.value = pass ? showRule.value : !showRule.value;
                    }
                  } else {
                    props.formData?.rules.push({
                      formId: props.form.id,
                      destId: showRule.target,
                      typeName: showRule.showType,
                      value: pass ? showRule.value : !showRule.value,
                    });
                  }
                }
                break;
              case 'calc':
                var calcRule = rule as model.FormCalcRule;
                var formula = calcRule.formula;
                try {
                  var isLegal = true;
                  var runtime: any = {
                    value: {},
                    decrypt: common.decrypt,
                    encrypt: common.encrypt,
                  };
                  calcRule.mappingData?.forEach((s) => {
                    {
                      const value = props.data[s.id];
                      if (!value) {
                        isLegal = false;
                      }
                      runtime[s.code] = value;
                    }
                  });
                  for (var i = 0; i < calcRule.trigger.length; i++) {
                    const triggerData = props.data[calcRule.trigger[i].replace('T', '')];
                    if (triggerData) {
                      formula = formula.replaceAll(`@${i}@`, JSON.stringify(triggerData));
                    } else {
                      isLegal = false;
                      break;
                    }
                  }
                  if (!isLegal) {
                    const defaultValue = props.fields.find((a) => a.id == calcRule.target)
                      ?.options?.defaultValue;
                    if (defaultValue) {
                      props.data[calcRule.target] = defaultValue;
                    } else {
                      delete props.data[calcRule.target];
                    }
                    return true;
                  } else {
                    common.Sandbox('value=' + formula)(runtime);
                    props.data[calcRule.target] = runtime.value;
                  }
                } catch {
                  logger.error(`计算规则[${formula}]执行失败，请确认是否维护正确!`);
                }
                break;
            }
          }
        }
      }
      return rules.length > 0;
    };
    if (checkHasChanged(fieldId, value)) {
      if (value === undefined || value === null) {
        delete props.data[fieldId];
      } else {
        props.data[fieldId] = value;
      }
      props.onValuesChange?.apply(this, [fieldId, value, props.data]);
      if (runRule(fieldId) && refresh) {
        // forceUpdate();
      }
    }
  };
  const writeData = (text: string) => {
    const hot = hotRef.current.hotInstance;
    hot.setDataAtCell(coordinate.row, coordinate.col, text);
    const coordinateId = [coordinate.row, coordinate.col].toString();
    props.onValuesChange?.apply(this, [coordinateId, text, props.data]);
  };

  useEffect(() => {
    const sheetListData: any = JSON.parse(props.form?.reportDatas);
    const selectItem: any = Object.values(sheetListData)[0];
    const setting = selectItem?.data?.setting || {};
    const datas = selectItem?.data?.data || [[]];
    updateHot(setting, datas);
  }, [props.form]);

  useEffect(() => {
    const hot = hotRef.current.hotInstance;
    if (props.formData?.after) {
      for (let key in props.formData.after[0]) {
        if (key.indexOf(',') != -1) {
          const array = key.split(',');
          cells.forEach((item: any) => {
            if (item.row == array[0] && item.col == array[1]) {
              hot.setDataAtCell(item.row, item.col, props.formData?.after[0][key]);
            }
          });
        }
      }
    }
  }, [cells]);

  const updateHot = (setting: any, datas: any) => {
    const hot = hotRef.current.hotInstance;
    const mergeCells = setting?.mergeCells || [];
    setCells(setting?.cells || []);
    setStyleList(setting?.styleList || []);
    hot.updateSettings({
      minCols: setting?.col_w.length,
      minRows: setting?.row_h.length,
      data: datas,
      mergeCells: mergeCells,
      rowHeights: setting?.row_h,
      colWidths: setting?.col_w,
    });
    setting.styleList?.forEach((item: any) => {
      hot.getCellMeta(item.row, item.col).renderer = 'cellStylesRenderer';
    });
    setting.classList?.forEach((item: any) => {
      let arr = [];
      for (let k in item.class) {
        arr.push(item.class[k]);
      }
      hotRef.current.hotInstance.setCellMeta(
        item.row,
        item.col,
        'className',
        arr.join(' '),
      );
    });
    setting.cells?.forEach((item: any) => {
      hot.getCellMeta(item.row, item.col).renderer = 'customStylesRenderer';
      switch (getWidget(item.prop.valueType, item.prop.widget)) {
        case '操作人':
          onValueChange(item.prop.id, props.belong.user.metadata.name, true);
          hot.setDataAtCell(item.row, item.col, props.belong.user.metadata.name);
          return;
        case '操作组织':
          onValueChange(item.prop.id, props.belong.metadata.name, true);
          hot.setDataAtCell(item.row, item.col, props.belong.metadata.name);
          return;
        case '数字框':
          hot.setCellMeta(item.row, item.col, 'type', 'numeric');
      }
      props.fields.forEach((field: any) => {
        if (item.prop.id === field.id) {
          if (!field.options.readOnly && !props.readonly) {
            hot.setCellMeta(item.row, item.col, 'readOnly', false);
          }
          if (field.options.defaultValue) {
            if (field.lookups.length > 0) {
              const items = field.lookups.find(
                (it: any) => it.value === field.options.defaultValue,
              );
              hot.setDataAtCell(item.row, item.col, items.text);
            } else {
              hot.setDataAtCell(item.row, item.col, field.options.defaultValue);
            }
            onValueChange(item.prop.id, field.options.defaultValue, true);
          }
        }
      });
    });
    setTimeout(() => {
      const customBordersPlugin = hot.getPlugin('customBorders');
      setting?.customBorders.forEach((it: any) => {
        if (it.range.length > 0) {
          customBordersPlugin.setBorders(it.range, it.customBorder);
        }
      });
    }, 100);
  };

  /** 渲染样式 **/
  registerRenderer('cellStylesRenderer', (hotInstance: any, TD: any, ...rest) => {
    textRenderer(hotInstance, TD, ...rest);
    const items = styleList.find((it: any) => it.row === rest[0] && it.col === rest[1]);
    const td: any = TD.style;
    if (items) {
      for (let key in items.styles) {
        if (key === 'paddingLeft') {
          td[key] = items.styles[key] + 'px';
        } else {
          td[key] = items.styles[key];
        }
      }
    }
  });

  /** 渲染特性背景色 **/
  registerRenderer('customStylesRenderer', (hotInstance: any, TD: any, ...rest) => {
    textRenderer(hotInstance, TD, ...rest);
    TD.style.background = '#e1f3d8';
  });

  // 点击单元格，属性处理
  const afterOnCellMouseDown = (_event: any, coords: any) => {
    if (props.readonly === false) {
      cells.forEach((item: any) => {
        if (item.col === coords.col && item.row === coords.row) {
          switch (getWidget(item.prop.valueType, item.prop.widget)) {
            case '选择框':
            case '引用选择框':
            case '多级选择框':
            case '人员搜索框':
            case '单位搜索框':
            case '群组搜索框':
            case '组织群搜索框':
            case '成员选择框':
            case '内部机构选择框':
            case '日期选择框':
            case '时间选择框':
              setCoordinate({ col: item.col, row: item.row });
              setEditMode(true);
              stagData.forEach((items: any) => {
                if (items.col === item.col && items.row === item.row) {
                  setSelectValue(items.value);
                }
              });
              props.fields.map((it) => {
                if (it.id == item.prop.id) {
                  setField(it);
                }
              });
              break;
          }
        }
      });
    }
  };

  // 文本类型onValueChange
  const afterChange = (changes: any, source: any) => {
    if (source === 'edit' || source === 'paste' || source === 'autofill') {
      changes.forEach((change: any) => {
        var row = change[0];
        var col = change[1];
        var newValue = change[3];
        cells.forEach((item: any) => {
          if (item.row == row && item.col == col) {
            onValueChange(item.prop.id, newValue, true);
            const coordinateId = [row, col].toString();
            props.onValuesChange?.apply(this, [coordinateId, newValue, props.data]);
          }
        });
      });
    }
  };

  return (
    <div>
      <HotTable
        ref={hotRef}
        readOnly={true}
        customBorders={true}
        rowHeaders={true}
        colHeaders={true}
        manualColumnResize={true}
        manualRowResize={true}
        dropdownMenu={true}
        height="630px"
        language={zhCN.languageCode}
        persistentState={true}
        stretchH="all"
        multiColumnSorting={true}
        filters={true}
        manualRowMove={true}
        outsideClickDeselects={false}
        afterChange={afterChange}
        licenseKey="non-commercial-and-evaluation" // for non-commercial use only
        afterOnCellMouseDown={afterOnCellMouseDown} //鼠标点击单元格边角后被调用
      />

      {editMode && (
        <CellItem
          data={props.data}
          belong={props.belong}
          rules={[...(props.formData?.rules ?? []), ...(props?.rules ?? [])].filter(
            (a) => a.destId == field.id,
          )}
          readOnly={props.readonly}
          field={field}
          notifyEmitter={notifyEmitter}
          onValuesChange={onValueChange}
          writeData={writeData}
          selectValue={selectValue}
          onCancel={() => {
            setEditMode(false);
          }}
        />
      )}
    </div>
  );
};

export default WorkReportViewer;
