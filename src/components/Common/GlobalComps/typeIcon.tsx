import { TargetType } from '@/ts/core';
import React from 'react';
import * as im from 'react-icons/im';
import * as fa from 'react-icons/fa';
import { BsHouseAddFill } from 'react-icons/bs';
import { Theme } from '@/config/theme';
import { Image } from 'antd';
interface TypeIconInfo {
  size?: number;
  iconType: string;
  name?: string;
}

/** 类型图标 */
const TypeIcon = (info: TypeIconInfo) => {
  const iconSize = info.size || 14;
  const config: any = { size: iconSize, color: Theme.FocusColor };
  const renderImage = (name: string, config: any) => {
    return (
      <Image
        width={config.size || 24}
        preview={false}
        src={`/svg/${name}.svg?v=1.0.0`}
        {...config}
      />
    );
  };
  const loadFileIcon = () => {
    switch (info.iconType) {
      case 'application/pdf':
        return renderImage('pdf', config);
      case 'application/x-zip-compressed':
        return <fa.FaFileArchive {...config} />;
      case 'application/msword':
        return renderImage('worldFile', config);
    }
    if (info.iconType === '页面模板') {
      return renderImage('template', config);
    }
    if (info.iconType === '新建页面模板') {
      return renderImage('newTemplate', config);
    }
    if (~info.iconType?.indexOf('word')) {
      return renderImage('worldFile', config);
    }
    if (~info.iconType?.indexOf('excel') || ~info.iconType?.indexOf('sheet')) {
      return renderImage('excelFile', config);
    }
    if (info.iconType?.startsWith('application')) {
      return renderImage('applicationFile', config);
    } else if (info.iconType?.startsWith('video')) {
      return renderImage('videoFile', config);
    } else if (info.iconType?.startsWith('image')) {
      return renderImage('imageFile', config);
    } else if (info.iconType?.startsWith('text')) {
      return renderImage('textFile', config);
    } else if (info.iconType?.startsWith('audio')) {
      return renderImage('videoFile', config);
    }
    return renderImage('unknowFile', config);
  };

  const loadIcon = () => {
    switch (info.iconType) {
      case '动态':
        return <im.ImSafari {...config} />;
      case '目录':
        return renderImage('directory', { ...config, color: 'blue', fill: 'blue' });
      case '成员目录':
        return <im.ImBooks {...config} />;
      case '标准':
        return <im.ImFileExcel {...config} />;
      case '字典':
        return renderImage('dataDictionary', config);
      case '新建字典':
        return renderImage('newDict', config);
      case '分类':
        return renderImage('classificationFile', config);
      case '新建分类':
        return renderImage('newSpecies', config);
      case '分类项':
        return <im.ImPriceTags {...config} />;
      case '属性':
        return renderImage('dataProperty', config);
      case 'newProperty':
        return renderImage('newProperty', config);
      case '应用':
        return renderImage('application', config);
      case '新建应用':
        return renderImage('addApplication', config);
      case '模块':
        return renderImage('newModule', config);
      case '新建模块':
        return renderImage('newModule', config);
      case '办事':
        return <im.ImShuffle {...config} />;
      case '表单':
        return renderImage('formFile', config);
      case '新建表单':
        return renderImage('newFormFile', config);
      case '角色':
        return <im.ImKey {...config} />;
      case '权限':
        return renderImage('permission', config);
      case '激活':
        return <im.ImPowerCord {...config} />;
      case '事项':
        return <im.ImClipboard {...config} />;
      case '加用户':
        return <im.ImUserPlus {...config} />;
      case '子流程':
      case 'setCluster':
        return renderImage('setCluster', config);
      case TargetType.Group:
        // return <im.ImTree {...config} />;
        return renderImage('types/group', config);
      case TargetType.Company:
        // return <im.ImOffice {...config} />;
        return renderImage('types/company', config);
      case TargetType.Storage:
        // return <im.ImDrive {...config} />;
        return renderImage('types/storage', config);
      case TargetType.Station:
        // return <im.ImAddressBook {...config} />;
        return renderImage('types/station', config);
      case TargetType.Cohort:
        // return <im.ImBubbles2 {...config} />;
        return renderImage('types/cohort', config);
      case TargetType.Section:
        // return <im.ImLibrary {...config} />;
        return renderImage('types/section', config);
      case TargetType.Department:
        return renderImage('types/department', config);
      case TargetType.College:
        return renderImage('types/college', config);
      case TargetType.Laboratory:
        return renderImage('types/laboratory', config);
      case TargetType.Office:
        return renderImage('types/office', config);
      case TargetType.Research:
        return renderImage('types/research', config);
      case TargetType.Working:
        return renderImage('types/working', config);
      case TargetType.Person:
        if (info.name && info.name.length > 1) {
          const name =
            info.name.length > 2 ? info.name.substring(1, 3) : info.name.substring(0, 2);
          const randomBg = ['blue', 'green', 'red', 'orange', 'asset', 'purple'].at(
            name.charCodeAt(1) % 6,
          );
          return (
            <div
              style={{
                width: iconSize,
                height: iconSize,
                lineHeight: iconSize + 'px',
                fontSize: iconSize / 3,
              }}
              className={`user-wrap user-wrap-bg_${randomBg}`}>
              {name}
            </div>
          );
        }
        return <im.ImUserTie {...config} />;
      case 'chat':
        return renderImage('chat-select', config);
      case 'newDir':
        return renderImage('addList', config);
      case 'refresh':
        return renderImage('refreshList', config);
      case 'remark':
        return renderImage('info', config);
      case 'open':
        return <im.ImDelicious {...config} />;
      case 'design':
        return <im.ImEqualizer {...config} />;
      case 'copy':
        return renderImage('copyFile', config);
      case 'move':
        return renderImage('moveFile', config);
      case 'parse':
        return <im.ImCoinPound {...config} />;
      case 'rename':
        return renderImage('renameFile', config);
      case 'download':
        return renderImage('renameFile', config);
      case 'delete':
        return renderImage('deleteOperate', config);
      case 'shortcut':
        return <im.ImLink {...config} />;
      case 'restore':
        return <im.ImUndo2 {...config} />;
      case 'remove':
        return renderImage('removeMember', config);
      case 'update':
        return renderImage('updateInfo', config);
      case 'pull':
        return <im.ImUserPlus {...config} />;
      case 'qrcode':
        return renderImage('qrcode', config);
      case 'joinFriend':
        return renderImage('addFriend', config);
      case 'joinCohort':
        return <im.ImUsers {...config} />;
      case 'joinCompany':
        return <BsHouseAddFill {...config} />;
      case 'joinStorage':
        return renderImage('joinStorageGroup', config);
      case 'joinGroup':
        return <im.ImEnter {...config} />;
      case 'newFile':
        return renderImage('uploadFile', config);
      case 'taskList':
        return renderImage('uploadList', config);
      case 'setToping':
        return <im.ImUpload3 {...config} />;
      case 'removeToping':
        return <im.ImDownload3 {...config} />;
      case 'setReaded':
        return <im.ImCheckmark {...config} />;
      case 'setNoReaded':
        return <im.ImBell {...config} />;
      case 'setCommon':
        return renderImage('commonlyUsed', config);
      case 'delCommon':
        return <im.ImHeartBroken {...config} />;
      default:
        return loadFileIcon();
    }
  };
  return loadIcon();
};

export default TypeIcon;
