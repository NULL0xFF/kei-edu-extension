/**
 * Application constants
 */

// Menu IDs for API requests
export const MENU_ID = {
  COURSE: 'MG0027',
  MEMBER: 'MG0086',
  COMPLETION: 'MG0036',
  APPLICATION: 'MG0028',
  COURSE_ELEMENT: 'MG0005'
};

// API endpoints
export const API_ENDPOINT = {
  COURSE: {
    LIST: '/course/active/selectActiveOperList.do',
    ELEMENT_LIST: '/course/active/selectAtiveElementList.do'
  },
  MEMBER: {
    LIST: '/user/member/selectMemberList.do'
  },
  COMPLETION: {
    LIST: '/course/cmpl/selectCmplList.do'
  },
  APPLICATION: {
    LIST: '/course/apply/selectApplyList.do'
  }
};

// Course constants
export const COURSE = {
  STATUS: {
    ALL: '',
    ACTIVE: 'active',
    INACTIVE: 'inactive'
  },
  TYPE: {
    ALL: '',
    ALWAYS: 'always',
    PERIOD: 'period'
  },
  CATEGORY: {
    ALL: '',
    INTRO: '1',
    ADVANCED: '2',
    GENERAL: '3',
    CUSTOMIZED: '14',
    FOREIGN: '16'
  },
  CATEGORY_NAME: {
    '1': '입문',
    '2': '심화',
    '3': '일반',
    '14': '맞춤형',
    '16': '외국어'
  },
  SORT: {
    TITLE_ASC: 1,
    TITLE_DESC: -1,
    CATEGORY_ASC: 2,
    CATEGORY_DESC: -2,
    STATUS_ASC: 3,
    STATUS_DESC: -3,
    DATE_ASC: 4,
    DATE_DESC: -4
  },
  ELEMENT_TYPE: {
    ORGANIZATION: 'organization',
    EXAM: 'exam'
  }
};

// Member constants
export const MEMBER = {
  STATUS: {
    ALL: '',
    APPROVAL: 'approval',
    WAIT: 'wait',
    LEAVE: 'leave',
    RELEAVE: 'releave'
  },
  SEARCH_CATEGORY: {
    ALL: '',
    NAME: 'memberName',
    ID: 'memberId',
    BIRTHDAY: 'memberBirthday',
    EMAIL: 'memberEmail',
    COMPANY: 'cxCompanyName'
  },
  SORT: {
    NAME_ASC: 1,
    NAME_DESC: -1,
    ID_ASC: 2,
    ID_DESC: -2,
    DATE_ASC: 3,
    DATE_DESC: -3
  }
};

// Completion constants
export const COMPLETION = {
  STATUS: {
    YES: 'Y',
    NO: 'N'
  },
  SORT: {
    MEMBER_ASC: 1,
    MEMBER_DESC: -1,
    END_DATE_ASC: 4,
    END_DATE_DESC: -4
  }
};

// Storage keys
export const STORAGE_KEY = {
  COURSES: 'courses',
  MEMBERS: 'members',
  LAST_UPDATE: 'lastUpdate'
};

// Network settings
export const NETWORK = {
  RETRY_LIMIT: 3,
  RETRY_DELAY: 1000,
  RETRY_FACTOR: 2,
  RETRY_CAP_MS: 16000,
  TOTAL_BUDGET_MS: 60000,
  TIMEOUT: 30000
};

// UI settings
export const UI = {
  REFRESH_INTERVAL: 1,
  BUTTON_CLASS: {
    PRIMARY: 'btn nor btn-blue',
    SECONDARY: 'btn nor btn-gray'
  }
};

// Export settings
export const EXPORT = {
  CSV_BOM: '\uFEFF'
};
