import { AiOutlineShoppingCart } from '@/icons/ai';
import { Badge, Button } from 'antd';
import React from 'react';
import { useThings } from '..';
import { IBoxProvider } from '@/ts/core/work/box';
import { command } from '@/ts/base';

interface IProps {
  box: IBoxProvider;
}

const ShoppingBadge: React.FC<IProps> = ({ box }) => {
  const things = useThings(box);
  return (
    <Badge count={things.length}>
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
