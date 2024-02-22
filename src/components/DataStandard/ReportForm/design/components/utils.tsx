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

const sumRangeExcelCells = (startCell: any, endCell: any) => {
  const lettersArray = startCell.match(/[a-zA-Z]+/g).join('|');
  const lettersArray2 = endCell.match(/[a-zA-Z]+/g).join('|');
  // console.log(lettersArray, lettersArray2, 'lettersArray');
  const startRow = parseInt(startCell.match(/\d+/)[0], 10);
  const endRow = parseInt(endCell.match(/\d+/)[0], 10);
  let formula = '';
  if (lettersArray == lettersArray2) {
    for (let row = startRow; row <= endRow; row++) {
      const cellKey = lettersArray + row;
      formula = formula ? formula + '+' + cellKey : cellKey;
    }
  }
  return formula;
};

/** 解析报表表达式坐标 */
export const parsingFormula = (formula: any, data: any) => {
  const sheetData: any[] = Object.values(JSON.parse(data));
  let newFormula;
  if (formula.indexOf('SUM') != -1) {
    let match = formula.match(/SUM\(([a-zA-Z]\d+):([a-zA-Z]\d+)\)/);
    if (match) {
      var startCoord = match[1]; // A2
      var endCoord = match[2]; // A6
    }
    newFormula = sumRangeExcelCells(startCoord, endCoord);
  } else {
    newFormula = formula;
  }
  const regex = /\b([A-Z]{1,10}\d+)\b/g;
  let flag = false;
  let newExpression = newFormula.replace(regex, function (matched: any) {
    let cell = parseExcelExpression(matched, sheetData[0]);
    for (let i = 0; i < sheetData.length; i++) {
      if (sheetData[i].name === cell.sheetName) {
        const cells = sheetData[i].data?.setting?.cells;
        for (let k = 0; k < cells.length; k++) {
          if (cells[k].row === cell.row && cells[k].col === cell.col) {
            flag = true;
            return cells[k].prop.propId;
          } else {
            if (k === cells.length - 1) {
              if (cells[k].row === cell.row && cells[k].col === cell.col) {
                return cells[k].prop.propId;
              } else {
                return matched;
              }
            }
            flag = false;
          }
        }
      } else {
        flag = false;
        return matched;
      }
    }
  });
  if (!flag) {
    console.log('无效公式！', newExpression);
  } else {
    console.log(newExpression, 'newFormula');
  }
};

const parseExcelExpression = (expression: any, sheetData: any) => {
  let sheetName, cellReference;
  if (expression.indexOf('!') != -1) {
    const parts = expression.split('!');
    sheetName = parts[0];
    cellReference = parts[1];
  } else {
    /** 如何没有表名，默认主表 */
    sheetName = sheetData.name;
    cellReference = expression;
  }
  const match = cellReference.match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    throw new Error('Invalid Excel coordinate format');
  }
  const columnLetters = match[1];
  const rowNumber = parseInt(match[2], 10) - 1;
  let colNumber = 0;
  for (let i = 0; i < columnLetters.length; i++) {
    colNumber *= 26;
    colNumber += columnLetters.charCodeAt(i) - 'A'.charCodeAt(0);
  }
  return {
    sheetName: sheetName,
    col: colNumber,
    row: rowNumber,
  };
};
