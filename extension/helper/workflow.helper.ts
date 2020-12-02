import { WorkflowList } from 'collection/workflow';
import util from 'common/util';

const Workflows = new WorkflowList();

const workflowHelper = {
  key: 'workflows',

  create: function(info) {
    if (info.title && info.content) {
      const workflow = Workflows.create({
        ...info,
      });

      return workflow;
    } else {
      return 'no title or content';
    }
  },

  remove: function(id) {
    const model = Workflows.remove(id);
    Workflows.chromeStorage.destroy(model);

    return model;
  },

  update: function(attrs) {
    const workflow = Workflows.set(attrs, {
      add: false,
      remove: false,
    });

    workflow.save();

    return workflow;
  },

  refresh() {
    return Workflows.fetch();
  },

  getWorkflow(id) {
    return Workflows.findWhere({
      id,
    });
  },

  getWorkflows: function() {
    return Workflows.toJSON();
  },

  getData() {
    return this.refresh().then(() => {
      const list = this.getWorkflows();

      return list;
    });
  },

  setData(list) {
    if (list && list.length) {
      const models = Workflows.set(list);

      models.forEach(model => {
        model.save();
      });

      return Promise.resolve(models);
    } else {
      return Promise.resolve('no websites');
    }
  },

  init: function() {
    return workflowHelper.refresh();
  },
};

export default workflowHelper;

// should cache
const numberReg = /(^[\d]+-[\d]+$)|(^[\d]+$)|^all$/;

function parseNumbers(part: string) {
  const matched = part.match(numberReg)[0];

  if (matched.indexOf('-') !== -1) {
    const sp = matched.split('-');

    return [sp[0], sp[1]].sort();
  } else if (matched === 'all') {
    return -1;
  } else {
    return matched;
  }
}

function resolveTemplate(text = '') {
  const pageData = window.Steward.data?.page;

  if (text.indexOf('{{') !== -1 && window.Steward.inContent && pageData) {
    return util.simTemplate(text, pageData);
  } else {
    return text;
  }
}

type LineNumber = string | string[] | -1;

function parseLine(line: string) {
  const realLine = line.replace(/^[\s\t]+/, '');
  const parts = realLine.split(/[|,，]/).slice(0, 3);
  let input: string, numbers: LineNumber, withShift: boolean;

  parts.forEach(part => {
    if (part.match(numberReg)) {
      numbers = parseNumbers(part);
    } else if (part.toLowerCase() === 'shift') {
      withShift = true;
    } else {
      input = resolveTemplate(part);
    }
  });

  return {
    input,
    numbers,
    withShift,
  };
}

export function parseWorkflow(content: string) {
  return content
    .split('\n')
    .filter(line => line && !line.match(/^[\s\t]+$/))
    .map(parseLine)
    .filter(cmd => cmd.input);
}

export function fixNumbers(numbers: string[]) {
  return numbers.map(fixNumber);
}

export function fixNumber(str: string) {
  const number = Number(str);

  if (number <= 0 || !number) {
    return 0;
  } else {
    return number - 1;
  }
}