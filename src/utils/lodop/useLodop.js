import { sleep } from '@/ts/base/common';
import { lodopInit } from './LodopFuncs';

export async function lodopCheck() {
  const init = lodopInit();
  await sleep(2000);
  let LODOP = init();
  if (LODOP == 'download') {
    return 'http://www.c-lodop.com/download/CLodop_Setup_for_Win64NT_6.571EN.zip';
  }
}

export async function printByLodop(data, printType, printName, size) {
  /**
   * Group 分组
   * @data 打印数据数组形式
   * @printType 打印方式
   * @printName 打印任务名字
   * @size 打印纸张大小A5 A4
   */
  // 初始化打印机
  const LODOP = lodopInit()();
  LODOP.PRINT_INIT(printName);
  switch (printType) {
    case 'IMG':
      for (let index = 0; index < data.length; index++) {
        LODOP.NewPage();
        LODOP.ADD_PRINT_IMAGE(
          '1%',
          '1%',
          '100%',
          '98%',
          `<img border='0' src=${data[index]} width=1000 height=1000/>`,
        );
        LODOP.SET_PRINT_STYLEA(0, 'Stretch', 1);
        LODOP.SET_PRINT_MODE('RESELECT_PRINTER', true);
        LODOP.SET_PRINT_MODE('RESELECT_ORIENT', true);
        LODOP.SET_PRINT_MODE('RESELECT_PAGESIZE', true);
        LODOP.SET_PRINT_MODE('RESELECT_COPIES', true);
      }
      break;
    case 'HTML':
      for (let index = 0; index < data.length; index++) {
        LODOP.NewPage();
        LODOP.SET_PRINT_PAGESIZE(1, 0, 0, size);
        LODOP.ADD_PRINT_HTM(0, 0, '100%', '96%', data);
      }
      break;
  }
  LODOP.PREVIEW();
}
