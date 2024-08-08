import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export class LocalStorage {
  static setItem(key: string, value: string) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, value);
    }
  }

  static getItem(key: string) {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem(key);
    }
    return null;
  }
  static removeItem(key: string) {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(key);
    }
  }
}

export class SessionStorage {
  static setItem(key: string, value: string) {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(key, value);
    }
  }

  static getItem(key: string) {
    if (typeof window !== "undefined") {
      return window.sessionStorage.getItem(key);
    }
    return null;
  }
  static removeItem(key: string) {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(key);
    }
  }
}

export const InputDate = (str: string | Date) => {
  let date = new Date(str);
  let year = date.getFullYear();
  let monthNumb = date.getMonth() + 1;
  let month = monthNumb <= 9 ? "0" + monthNumb : monthNumb;
  let day = date.getDate() <= 9 ? "0" + date.getDate() : date.getDate();
  return `${year}-${month}-${day}`;
};

export const ShowDate = (str: string | Date) => {
  let date = new Date(str);
  let year = date.getFullYear();
  let monthNumb = date.getMonth() + 1;
  let month = monthNumb < 9 ? "0" + monthNumb : monthNumb;
  let day = date.getDate() < 9 ? "0" + date.getDate() : date.getDate();
  return `${day}/${month}/${year}`;
};

export function formatNumber(number: number) {
  let str = number.toString();
  while (str.length < 4) {
    str = "0" + str;
  }
  return str;
}