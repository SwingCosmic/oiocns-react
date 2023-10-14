import { FieldModel } from '@/ts/base/model';
import { IForm } from '@/ts/core';
import { ShareIdSet } from '@/ts/core/public/entity';
import { Col, Row, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import { useDrag } from 'react-dnd';
import FormProp from '../StandardProp';
import cls from './index.module.less';
import { IExistTypeProps } from '../IExistTypeEditor';

const AttrsProp: React.FC<IExistTypeProps> = (props) => {
  const form = ShareIdSet.get(props.value + '*') as IForm | undefined;
  const [fields, setFields] = useState(form?.fields ?? []);
  useEffect(() => {
    form?.loadContent().then(() => setFields(form.fields));
  });
  return (
    <div className={cls.attrsContainer}>
      <FormProp {...props} />
      <Row className={cls.fields}>
        {fields.map((field) => {
          return <Field key={field.id} field={field} />;
        })}
      </Row>
    </div>
  );
};

interface FieldProps {
  field: FieldModel;
}

const Field: React.FC<FieldProps> = ({ field }) => {
  const [, drag] = useDrag<FieldModel, FieldModel, {}>(() => ({
    type: field.valueType,
    item: field,
  }));
  return (
    <Col>
      <Tag ref={drag}>{field.name}</Tag>
    </Col>
  );
};

export default AttrsProp;
