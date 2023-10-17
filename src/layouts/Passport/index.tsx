import React, { useState } from 'react';
import { IRouteConfig } from '../../../typings/globelType';
import OrginOneLayout from './OrginOne';
import ShareCloudLayout from './ShareCloud';

const PassportLayout: React.FC<{ route: IRouteConfig }> = ({ route }) => {
  if (window.location.href.includes('asset')) {
    return <ShareCloudLayout route={route} />;
  }
  // const [main, setMain] = useState(
  //   <div>
  //     <div style={{ width: '100%', height: '100%' }}>
  //       <img
  //         style={{ width: '100%', height: '100%' }}
  //         src="/img/passport/orginOne/main.png"
  //       />
  //     </div>
  //     <div
  //       style={{
  //         position: 'fixed',
  //         top: '60%',
  //         left: '50%',
  //         transform: 'translate(-50%)',
  //       }}
  //       onClick={() => {
  //         setMain(<OrginOneLayout route={route} />);
  //       }}>
  //       <img src="/img/button.png" />
  //       <div
  //         style={{
  //           fontSize: 20,
  //           color: 'white',
  //           position: 'absolute',
  //           top: '50%',
  //           left: '50%',
  //           transform: 'translate(-50%, -50%)',
  //         }}>
  //         进入系统
  //       </div>
  //     </div>
  //   </div>,
  // );
  return <OrginOneLayout route={route}/>;
};

export default PassportLayout;
