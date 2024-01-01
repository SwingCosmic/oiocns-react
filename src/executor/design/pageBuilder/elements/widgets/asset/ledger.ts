
export interface AssetLedgerSummary {
  afterAccumulatedDepreciation: number;
  afterOriginalValue: number;
  beforeAccumulatedDepreciation: number;
  beforeOriginalValue: number;
  plusAccumulatedDepreciation: number;
  plusOriginalValue: number;
  minusAccumulatedDepreciation: number;
  minusOriginalValue: number;

  assetTypeId: string;
  assetTypeName: string;
  canClick: boolean;
  child: AssetLedgerSummary[];
  init: boolean;
  isParent: boolean;
  month: string;
  belongId: string;
  [key: string]: any;
}

export const postfixMap = [
  {
    label: '原值',
    postfix: 'OriginalValue',
  },
  {
    label: '累计折旧',
    postfix: 'AccumulatedDepreciation',
  },
];
export const prefixMap = [
  {
    label: '期初',
    prefix: 'before',
  },
  {
    label: '增加',
    prefix: 'plus',
  },
  {
    label: '减少',
    prefix: 'minus',
  },
  {
    label: '期末',
    prefix: 'after',
  },
];