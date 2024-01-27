export const generateSequence = (n: number) => {
  let sequence = [];
  for (let i = 0; i < n; i++) {
    let charCode = 65;
    let str = '';
    let num = i;
    while (num >= 0) {
      str = String.fromCharCode(charCode + (num % 26)) + str;
      num = Math.floor(num / 26) - 1;
    }
    sequence.push(str);
  }
  return sequence;
};

export const generateArrayByLength = (length: number) => {
  var array = [];
  for (var i = 0; i < length; i++) {
    array.push(i + 1);
  }
  return array;
};

export const contrast = async (
  arr: number[],
  arr2: number[],
  index: number,
  amount: number,
) => {
  let json: any = {};
  arr.forEach((item, index2) => {
    if (index2 >= index) {
      json[item] = arr2[index2 + amount];
    }
  });
  return json;
};

/** 替换计算规则表达式坐标 */
export const replaceRules = (contrastArray: any, rules: any) => {
  rules.forEach((item: any) => {
    const lettersArray = item.formula.match(/[a-zA-Z]+/g).join('|');
    const numbersArray = item.formula.match(/[0-9]+/g).join('|');
    let reg = new RegExp(`(${lettersArray}|${numbersArray})`, 'g');
    let newExpression = item.formula.replace(reg, function (matched: any) {
      for (let key in contrastArray) {
        if (key === matched) {
          return contrastArray[key];
        } else {
          let keys = Object.keys(contrastArray);
          if (key === keys[keys.length - 1]) {
            if (key === matched) {
              return contrastArray[key];
            } else {
              return matched;
            }
          }
        }
      }
    });
    item.formula = newExpression;
  });
  return rules;
};

/** 解析报表表达式坐标 */
export const parsingFormula = (formula: string, data: any) => {
  const sheetData = JSON.parse(data);
  const regex = /@(.*?)@/g;
  let match;
  while ((match = regex.exec(formula)) !== null) {
    let cell = parseExcelExpression(match[1]);
    console.log(cell, '返回解析报表表达式坐标');
    if (cell.sheetName === '') {
      const sheet: any = Object.values(sheetData)[0];
      sheet.data?.setting?.cells?.forEach((it: any) => {
        if (it.row === cell.row && it.col === cell.col) {
          console.log(it, 'it1');
        }
      });
    } else {
      Object.values(sheetData).forEach((item: any) => {
        if (item.name === cell.sheetName) {
          item.cells.forEach((it: any) => {
            if (it.row === cell.row && it.col === cell.col) {
              console.log(it, 'it2');
            }
          });
        }
      });
    }
  }
};

const parseExcelExpression = (expression: any) => {
  let sheetName, cellReference;
  if (expression.indexOf('!') != -1) {
    const parts = expression.split('!');
    sheetName = parts[0];
    cellReference = parts[1];
  } else {
    sheetName = '';
    cellReference = expression;
  }
  const match = cellReference.match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    throw new Error('Invalid Excel coordinate format');
  }
  const columnLetters = match[1];
  const rowNumber = parseInt(match[2], 10);
  let colNumber = 0;
  for (let i = 0; i < columnLetters.length; i++) {
    colNumber *= 26;
    colNumber += columnLetters.charCodeAt(i) - 'A'.charCodeAt(0) + 1;
  }
  return {
    sheetName: sheetName,
    col: colNumber,
    row: rowNumber,
  };
};
