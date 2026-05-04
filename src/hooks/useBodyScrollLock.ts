import { useEffect } from 'react';

let lockCount = 0;
let scrollY = 0;
let originalBodyOverflow = '';
let originalBodyPaddingRight = '';
let originalBodyPosition = '';
let originalBodyTop = '';
let originalBodyLeft = '';
let originalBodyRight = '';
let originalBodyWidth = '';
let originalDocumentOverflow = '';

const lockBodyScroll = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  if (lockCount === 0) {
    const { body, documentElement } = document;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    scrollY = window.scrollY;
    originalBodyOverflow = body.style.overflow;
    originalBodyPaddingRight = body.style.paddingRight;
    originalBodyPosition = body.style.position;
    originalBodyTop = body.style.top;
    originalBodyLeft = body.style.left;
    originalBodyRight = body.style.right;
    originalBodyWidth = body.style.width;
    originalDocumentOverflow = documentElement.style.overflow;

    documentElement.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  lockCount += 1;
};

const unlockBodyScroll = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  lockCount = Math.max(lockCount - 1, 0);

  if (lockCount === 0) {
    const { body, documentElement } = document;

    documentElement.style.overflow = originalDocumentOverflow;
    body.style.overflow = originalBodyOverflow;
    body.style.paddingRight = originalBodyPaddingRight;
    body.style.position = originalBodyPosition;
    body.style.top = originalBodyTop;
    body.style.left = originalBodyLeft;
    body.style.right = originalBodyRight;
    body.style.width = originalBodyWidth;

    window.scrollTo(0, scrollY);
  }
};

export const useBodyScrollLock = (locked: boolean) => {
  useEffect(() => {
    if (!locked) return;

    lockBodyScroll();

    return () => {
      unlockBodyScroll();
    };
  }, [locked]);
};