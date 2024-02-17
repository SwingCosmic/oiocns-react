import { Popover, Input, Button } from 'antd';
import React, { useEffect, useState } from 'react';
import { IMessage, ISession, ISysFileInfo, MessageType } from '@/ts/core';
import OpenFileDialog from '@/components/OpenFileDialog';
import { parseCiteMsg } from '../components/parseMsg';
import Emoji from '../components/emoji';
import { AiOutlineClose } from 'react-icons/ai';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { HiOutlineVideoCamera } from 'react-icons/hi2';
import { TbSend } from 'react-icons/tb';
import { Theme } from '@/config/theme';
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
  const [citeShow, setCiteShow] = useState<boolean>(false); // @展示
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
          <AiOutlineClose
            size={20}
            style={{ marginRight: '6px' }}
            onClick={() => props.closeCite()}
            className="cite-text-close-icon"
          />
          {parseCiteMsg(val)}
        </div>
      </div>
    );
  };

  /** 点击空白处取消 @ 弹窗 */
  window.addEventListener('click', () => {
    setCiteShow(false);
  });

  return (
    <div className="chat-send-box">
      <div style={{ width: '100%' }}>
        {props.citeText && citeShowText(props.citeText)}
      </div>
      <div className="chat-send-box-main">
        <div style={{ width: '100%' }}>
          {citeShow && (
            <Popover
              align={{
                points: ['t', 'l'],
              }}
              content={
                <div className="chat-at-list">
                  {props.chat.members
                    .filter((i) => i.id != props.chat.userId)
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
                            setMessage((message) => message + i.name + ' ');
                          }}>
                          <EntityIcon disInfo entity={i} size={35} />
                          <span>{i.name}</span>
                        </div>
                      );
                    })}
                </div>
              }
              open={citeShow}
              trigger={['click', 'contextMenu']}
              onOpenChange={setCiteShow}></Popover>
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
                  setCiteShow(true);
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
          <svg
            lang="表情"
            fill={Theme.FocusColor}
            width={26}
            viewBox="0 0 24 24"
            onClick={() => setOpenEmoji(!openEmoji)}>
            <path d="M9.447 15.398a.75.75 0 0 0-.894 1.205A5.766 5.766 0 0 0 12 17.75a5.766 5.766 0 0 0 3.447-1.147.75.75 0 0 0-.894-1.206A4.266 4.266 0 0 1 12 16.25a4.266 4.266 0 0 1-2.553-.852ZM16 10.5c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5.448-1.5 1-1.5 1 .672 1 1.5ZM9 12c.552 0 1-.672 1-1.5S9.552 9 9 9s-1 .672-1 1.5.448 1.5 1 1.5Z" />
            <path d="M12 1.25C6.063 1.25 1.25 6.063 1.25 12S6.063 22.75 12 22.75 22.75 17.937 22.75 12 17.937 1.25 12 1.25ZM2.75 12a9.25 9.25 0 1 1 18.5 0 9.25 9.25 0 0 1-18.5 0Z" />
          </svg>
        </Popover>
        <svg lang="语言" fill={Theme.FocusColor} width={26} viewBox="0 0 24 24">
          <path d="M6.25 8a5.75 5.75 0 1 1 11.5 0v3a5.75 5.75 0 0 1-11.5 0V8ZM12 3.75A4.25 4.25 0 0 0 7.75 8v3a4.25 4.25 0 0 0 8.5 0V8A4.25 4.25 0 0 0 12 3.75Zm-8 5.5a.75.75 0 0 1 .75.75v1a7.25 7.25 0 1 0 14.5 0v-1a.75.75 0 0 1 1.5 0v1a8.75 8.75 0 0 1-8 8.718V22a.75.75 0 0 1-1.5 0v-2.282a8.75 8.75 0 0 1-8-8.718v-1A.75.75 0 0 1 4 9.25Z" />
        </svg>
        <svg
          lang="文件"
          fill={Theme.FocusColor}
          width={26}
          viewBox="0 0 24 24"
          onClick={() => setOpen(true)}>
          <path d="M16.5 3 21 7.5v12a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-15A1.5 1.5 0 0 1 4.5 3h12ZM15 4.5H9v2.25h6V4.5Zm1.5.621V8.25h-9V4.5h-3v15h3V12h9v7.5h3V8.121l-3-3ZM15 19.5v-6H9v6h6Z" />
        </svg>
        <HiOutlineVideoCamera title="视频" size={26} color={Theme.FocusColor} />
        <Button
          disabled={!message.length}
          size="small"
          onClick={() => sendMessage()}
          type={message.length > 0 ? 'primary' : 'default'}
          icon={<TbSend fontSize={16} style={{ verticalAlign: 'middle' }} />}>
          <span style={{ fontSize: '12px', lineHeight: '20px' }}>&nbsp;发送</span>
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
