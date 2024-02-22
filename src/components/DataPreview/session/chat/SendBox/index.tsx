import { Popover, Input, Button } from 'antd';
import React, { useEffect, useState } from 'react';
import { IMessage, ISession, ISysFileInfo, MessageType } from '@/ts/core';
import OpenFileDialog from '@/components/OpenFileDialog';
import { parseCiteMsg } from '../components/parseMsg';
import Emoji from '../components/emoji';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import OrgIcons from '@/components/Common/GlobalComps/orgIcons';
import { TextBox } from 'devextreme-react';
const TextArea = Input.TextArea;
/**
 * @description: 输入区域
 * @return {*}
 */

interface IProps {
  chat: ISession;
  citeText?: IMessage;
  writeContent?: string;
  closeCite: () => void;
}

const GroupInputBox = (props: IProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [openEmoji, setOpenEmoji] = useState(false);
  const [atShow, setAtShow] = useState<boolean>(false);
  const [message, setMessage] = useState(props.chat.inputContent.message);

  useEffect(() => {
    if (props.writeContent) {
      setMessage(props.writeContent);
    }
  }, [props.writeContent]);

  useEffect(() => {
    props.chat.inputContent.message = message;
  }, [message]);

  /** 发送消息 */
  const sendMessage = () => {
    if (message.length > 0) {
      const vaildMentions: string[] = [];
      for (const mention of props.chat.inputContent.mentions) {
        if (message.includes(mention.text) && !vaildMentions.includes(mention.id)) {
          vaildMentions.push(mention.id);
        }
      }
      props.chat.sendMessage(MessageType.Text, message, vaildMentions, props.citeText);
      setMessage('');
      props.closeCite();
    }
  };

  /** 引用展示 */
  const citeShowText = (val: IMessage) => {
    return (
      <div className="cite-text">
        <div className="cite-text-content">
          <OrgIcons
            type="/toolbar/close"
            size={30}
            notAvatar
            onClick={() => props.closeCite()}
            className="cite-text-close-icon"
          />
          {parseCiteMsg(val)}
        </div>
      </div>
    );
  };

  /** 渲染@列表 */
  const RenderAtList = () => {
    const [filter, setFilter] = useState('');
    return (
      <div className="chat-at-list">
        <div style={{ width: '100%' }}>
          <TextBox
            width="100%"
            mode="search"
            placeholder="搜索"
            showClearButton
            value={filter}
            stylingMode="filled"
            valueChangeEvent="input"
            onValueChanged={(e) => {
              setFilter(e.value ?? '');
            }}
          />
        </div>
        {props.chat.members
          .filter((i) => i.id != props.chat.userId)
          .filter((i) => i.name.includes(filter) || i.code.includes(filter))
          .map((i) => {
            return (
              <div
                key={i.id}
                className="chat-at-list-item"
                onClick={() => {
                  props.chat.inputContent.mentions.push({
                    id: i.id,
                    text: `@${i.name} `,
                  });
                  setAtShow(false);
                  setMessage((message) => message + i.name + ' ');
                }}>
                <EntityIcon disInfo entity={i} size={35} />
                <span>{i.name}</span>
              </div>
            );
          })}
      </div>
    );
  };

  return (
    <div className="chat-send-box">
      <div style={{ width: '100%' }}>
        {props.citeText && citeShowText(props.citeText)}
      </div>
      <div className="chat-send-box-main">
        <div style={{ width: '100%' }}>
          {atShow && (
            <Popover
              align={{
                points: ['t', 'l'],
              }}
              content={<RenderAtList />}
              open={atShow}
              trigger={['click', 'contextMenu']}
              onOpenChange={setAtShow}></Popover>
          )}
          <TextArea
            value={message}
            autoSize={{ minRows: 1 }}
            allowClear={true}
            placeholder={`Enter键发送, Alt+Enter键换行。`}
            bordered={false}
            onChange={(e) => {
              const value = e.target.value;
              if (!value.endsWith('\n')) {
                if (value.endsWith('@')) {
                  setMessage(value);
                  setAtShow(true);
                } else {
                  setMessage(value);
                }
              } else {
                setMessage(value);
              }
            }}
            onPressEnter={(e) => {
              e.preventDefault();
              if (e.altKey === true && e.key === 'Enter') {
                setMessage((pre) => pre + '\n');
              } else {
                sendMessage();
              }
            }}
          />
        </div>
        <OrgIcons type="/toolbar/setFull" size={26} notAvatar />
        <Popover
          content={
            <Emoji
              onSelect={(emoji: string) => {
                setOpenEmoji(false);
                setMessage((message) => message + emoji);
              }}
            />
          }
          open={openEmoji}
          trigger={['click', 'contextMenu']}
          onOpenChange={setOpenEmoji}>
          <OrgIcons type="/toolbar/emoji" size={26} notAvatar />
        </Popover>
        <OrgIcons type="/toolbar/audio" size={26} notAvatar />
        <OrgIcons
          type="/toolbar/files"
          size={26}
          onClick={() => setOpen(true)}
          notAvatar
        />
        <OrgIcons type="/toolbar/video" size={26} notAvatar />
        <Button
          disabled={!message.length}
          size="middle"
          onClick={() => sendMessage()}
          type={message.length > 0 ? 'primary' : 'default'}
          icon={<OrgIcons type="/toolbar/send" size={20} notAvatar />}>
          <span style={{ fontSize: '14px', lineHeight: '20px' }}>&nbsp;发送</span>
        </Button>
      </div>
      {open && (
        <OpenFileDialog
          rootKey={'disk'}
          accepts={['文件']}
          allowInherited
          currentKey={props.chat.target.directory.key}
          onCancel={() => setOpen(false)}
          onOk={async (files) => {
            if (files.length > 0) {
              const file = files[0] as ISysFileInfo;
              let msgType = MessageType.File;
              if (file.groupTags.includes('图片')) {
                msgType = MessageType.Image;
              } else if (file.groupTags.includes('视频')) {
                msgType = MessageType.Video;
              }
              await props.chat.sendMessage(msgType, JSON.stringify(file.shareInfo()), []);
            }
            setOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default GroupInputBox;
