import React, { ReactNode } from 'react';
import { WithCommonProps, defineElement } from '../defineElement';
import { Layout, Responsive, WidthProvider } from 'react-grid-layout';
import { Slot } from '../../render/Slot';
import { ExistTypeMeta } from '../../core/ElementMeta';

const ResponsiveLayout = WidthProvider(Responsive);

interface GridProps extends IProps {
  onChange: (layout: Layout[]) => void;
  children: ReactNode;
}

export const Grid: React.FC<GridProps> = (props) => {
  console.log(props);
  return (
    <ResponsiveLayout
      style={{ width: '100%' }}
      rowHeight={props.rowHeight}
      layouts={{
        lg: props.layout,
        md: props.layout,
        sm: props.layout,
        xs: props.layout,
        xxs: props.layout,
      }}
      allowOverlap={false}
      preventCollision
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      onLayoutChange={(layout) => props.onChange(layout)}
      cols={{
        lg: props.cols,
        md: (props.cols * 10) / 12,
        sm: (props.cols * 6) / 12,
        xs: (props.cols * 4) / 12,
        xxs: (props.cols * 2) / 12,
      }}>
      {props.children}
    </ResponsiveLayout>
  );
};

interface IProps {
  layout: Layout[];
  cols: number;
  rowHeight: number;
}

export const Design: React.FC<WithCommonProps<IProps>> = (props) => {
  return (
    <Grid {...props} onChange={(layout: Layout[]) => (props.props['layout'] = layout)}>
      {props.children.map((c) => (
        <div key={c.id}>
          <Slot key={c.id} child={c} />
        </div>
      ))}
    </Grid>
  );
};

export default defineElement({
  render(props) {
    return <Design {...props}></Design>;
  },
  displayName: 'Grid',
  meta: {
    props: {
      cols: {
        type: 'number',
        default: 12,
      },
      rowHeight: {
        type: 'number',
        default: 10,
      },
      layout: {
        type: 'array',
        elementType: {
          type: 'type',
          typeName: '布局节点',
        } as ExistTypeMeta<Layout>,
        default: [],
      },
    },
    label: '栅格布局',
    type: 'Container',
  },
});
