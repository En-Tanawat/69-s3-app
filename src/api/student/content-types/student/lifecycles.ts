import type { Event } from '@strapi/database';
import { errors } from '@strapi/utils';

// Helper to check if a string is already Base64 encoded
const isBase64 = (str: string): boolean => {
  if (typeof str !== 'string') return false;
  // A 10-character string encoded in Base64 is exactly 16 characters ending with '=='
  if (str.length !== 16 || !str.endsWith('==')) return false;
  try {
    return Buffer.from(str, 'base64').toString('base64') === str;
  } catch {
    return false;
  }
};

const encodeMobile = (data: any) => {
  if (!data || typeof data !== 'object') return;
  // If value was masked (ends with xxx), do not overwrite with masked value
  if (typeof data.mobile === 'string' && data.mobile.endsWith('xxx')) {
    delete data.mobile;
    return;
  }
  if (data.mobile && !isBase64(data.mobile)) {
    if (String(data.mobile).length !== 10) {
      throw new errors.ValidationError('mobile must be exactly 10 characters');
    }
    data.mobile = Buffer.from(String(data.mobile), 'utf-8').toString('base64');
  }
};

const decodeMobile = (data: any) => {
  if (!data || typeof data !== 'object') return;
  if (data.mobile && isBase64(data.mobile)) {
    const decoded = Buffer.from(data.mobile, 'base64').toString('utf-8');
    data.mobile = decoded.length >= 3 ? decoded.slice(0, -3) + 'xxx' : 'xxx';
  } else if (data.mobile && typeof data.mobile === 'string' && !data.mobile.endsWith('xxx')) {
    data.mobile = data.mobile.length >= 3 ? data.mobile.slice(0, -3) + 'xxx' : 'xxx';
  }
};

export default {
  beforeCreate(event: Event) {
    const { data } = event.params;
    if (Array.isArray(data)) {
      data.forEach(encodeMobile);
    } else {
      encodeMobile(data);
    }
  },

  beforeUpdate(event: Event) {
    const { data } = event.params;
    if (Array.isArray(data)) {
      data.forEach(encodeMobile);
    } else {
      encodeMobile(data);
    }
  },

  beforeCreateMany(event: Event) {
    const { data } = event.params;
    if (Array.isArray(data)) {
      data.forEach(encodeMobile);
    } else {
      encodeMobile(data);
    }
  },

  beforeUpdateMany(event: Event) {
    const { data } = event.params;
    if (Array.isArray(data)) {
      data.forEach(encodeMobile);
    } else {
      encodeMobile(data);
    }
  },

  afterFindOne(event: Event) {
    const { result } = event;
    decodeMobile(result);
  },

  afterFindMany(event: Event) {
    const { result } = event;
    if (Array.isArray(result)) {
      result.forEach(decodeMobile);
    } else {
      decodeMobile(result);
    }
  },
};
