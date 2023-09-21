
import { useState, useRef, MutableRefObject, useMemo } from "react";


type NonFunction<T> = T extends (...args: any[]) => any ? never : T;

/**
 * 创建一个可读写的状态，可以选择是否影响渲染
 * @param initialValue 初始值，可以是`T`或`T`类型的工厂，但`T`本身不能是函数
 * @param isRef 是否为ref（不影响渲染）
 * @returns 返回的状态
 */
export function useSignal<T>(initialValue: NonFunction<T> | (() => NonFunction<T>), isRef = false) {
  if (isRef) {
    if (typeof initialValue === "function") {
      initialValue = (initialValue as Function)() as NonFunction<T>;
    }
    return useRef(initialValue);
  }

  // 永不重新计算
  return useMemo(() => createSignal(initialValue), []);
}


function createSignal<T>(initialValue: T | (() => T)): MutableRefObject<T> {
  let [state, setState] = useState(initialValue);
  const s = {
    __value: state,
  } as any;
  Object.defineProperty(s, "current", {
    get() {
      return s.__value;
    },
    set(v) {
      // 可以立即读取到最新值
      s.__value = v;
      setState(_ => v);
    }
  });
  return s;
}
