import { schema } from '@/ts/base';
import { IEntity } from '@/ts/core';

interface IPeriod extends IEntity<schema.XPeriod> {
  /** 元数据 */
  period: schema.XPeriod;
  /** 计提折旧 */
  depreciationCalculating(options: any): Promise<void>;
  /** 月结账 */
  monthlyClosing(options: any): Promise<void>;
  /** 试算平衡 */
  trialBalance(options: any): Promise<void>;
}
