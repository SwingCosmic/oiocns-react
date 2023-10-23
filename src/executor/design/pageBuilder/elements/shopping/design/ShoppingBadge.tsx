import { AiOutlineShoppingCart } from '@/icons/ai';
import { Badge, Button } from 'antd';
import React from 'react';
import { IBoxProvider } from '@/ts/core/work/box';
import { command } from '@/ts/base';
import { useStagings } from '../useChange';

interface IProps {
  box: IBoxProvider;
}

const ShoppingBadge: React.FC<IProps> = ({ box }) => {
  const stagings = useStagings(box);
  return (
    <Badge count={stagings.length}>
      <Button
        size="large"
        type="primary"
        shape="circle"
        onClick={() => command.emitter('stagings', 'open')}
        icon={<AiOutlineShoppingCart />}
      />
    </Badge>
  );
};

export default ShoppingBadge;
