const fs = require("fs/promises");

// Hàm hỗ trợ để lấy giá trị từ một đường dẫn biến
function getValueFromPath(object, path) {
  const parts = path.split(".");
  let value = object;
  for (const part of parts) {
    if (value.hasOwnProperty(part)) {
      value = value[part];
    } else {
      return "";
    }
  }
  return value;
}
function render(rendered, data) {
  // Thực hiện thay thế các biến trong template
  const variableRegex = /21575{\s*([\w.]+)\s*}/g;
  let match;
  while ((match = variableRegex.exec(rendered)) !== null) {
    const [fullMatch, variableName] = match;
    const value = getValueFromPath(data, variableName);
    if (value != "") {
      rendered = rendered.replace(fullMatch, value);
    }
  }
  return rendered;
}

// Hàm đệ quy để xử lý các phần template nhỏ
async function renderPartials(rendered) {
  // Thêm hỗ trợ cho các phần template nhỏ
  const partialRegex = /21575{\+\s*([\w.]+)\s*}/g;
  let match;
  while ((match = partialRegex.exec(rendered)) !== null) {
    const [fullMatch, partialName] = match;
    // Đọc nội dung của file partial
    const partialContent = await fs.readFile(`./views/${partialName}.html`, {
      encoding: "utf-8",
    });
    // Đệ quy để xử lý các phần template nhỏ bên trong
    const replacedPartialContent = await renderPartials(partialContent);
    // Thay thế phần template nhỏ trong template chính
    rendered = rendered.replace(fullMatch, replacedPartialContent);
  }
  return rendered;
}

function renderFor(rendered, options) {
  const forRegex =
    /21575{for\s+(\w+)\s+in\s+(\w+)\s*}([\s\S]*?){\s*\/for\s*}/gs;
  while ((match = forRegex.exec(rendered)) !== null) {
    const [fullMatch, variable, array, content] = match;
    const items = options[array];
    if (Array.isArray(items)) {
      // Thực hiện vòng lặp và thay thế nội dung vòng lặp trong template
      const replacement = items
        .map((item) => {
          // Thay thế biến trong phần nội dung vòng lặp
          const object = { [variable]: item };
          // console.log(content);
          const itemContent = render(content, object);
          return itemContent;
        })
        .join("");
      rendered = rendered.replace(fullMatch, replacement);
    } else {
      // Nếu không phải mảng, loại bỏ vòng lặp
      rendered = rendered.replace(fullMatch, "");
    }
  }
  return rendered;
}
function renderNestedFor(rendered, options) {
  // Thêm hỗ trợ cho vòng lặp lồng nhau
  const nestedForRegex =
    /21575{for\s+(\w+)\s+in\s+(\w+)\s*}([\s\S]*?)\s*21575{for\s+(\w+)\s+in\s+(\w+)\s*}([\s\S]*?){\s*\/for\s*}([\s\S]*?){\s*\/for\s*}/gs;
  let match;
  while ((match = nestedForRegex.exec(rendered)) !== null) {
    const [
      fullMatch,
      outerVar,
      outerArrName,
      outerContent,
      innerVar,
      innerArrName,
      innerInnerVar,
      innerContent,
    ] = match;
    // console.log(match);
    const outerArrays = getValueFromPath(options, outerArrName);
    if (Array.isArray(outerArrays)) {
      // Thực hiện vòng lặp ngoại và thay thế nội dung vòng lặp trong template
      const outerReplacement = outerArrays
        .map((outerArr) => {
          // console.log(outerArr);
          const innerArr = outerArr;
          // console.log(innerArrName);
          // const innerArr = getValueFromPath(outerArr, innerArrName);
          // console.log(innerArr);
          if (Array.isArray(innerArr)) {
            // Thực hiện vòng lặp nội và thay thế nội dung vòng lặp trong template
            const innerReplacement = innerArr
              .map((innerItem) => {
                const object = { [innerVar]: innerItem };
                const itemContent = render(innerInnerVar, object);
                // console.log(itemContent);
                return itemContent;
              })
              .join("");
            return innerReplacement;
          }
          return "";
        })
        .join("");

      // Thay thế vòng lặp lồng nhau trong template
      rendered = rendered.replace(fullMatch, outerReplacement);
    } else {
      // Nếu không phải mảng, loại bỏ vòng lặp
      rendered = rendered.replace(fullMatch, "");
    }
  }

  return rendered;
}

const renderTemplate = async function (filePath, options, callback) {
  const content = await fs.readFile(filePath, { encoding: "utf-8" });
  let rendered = content;
  rendered = await renderPartials(rendered);
  rendered = render(rendered, options);

  // Thêm hỗ trợ cho câu lệnh if-else
  const ifElseRegex =
    /21575{\s*if\s+(\w+)\s*}([\s\S]*?){\s*else\s*}([\s\S]*?){\s*\/if\s*}/gs;
  let match;
  while ((match = ifElseRegex.exec(rendered)) !== null) {
    const [fullMatch, condition, ifContent, elseContent] = match;
    const value = options[condition];
    // Thực hiện thay thế nội dung dựa trên điều kiện
    const replacement = value ? ifContent : elseContent || "";
    rendered = rendered.replace(fullMatch, replacement);
  }

  // Thêm hỗ trợ cho vòng lặp lồng nhau
  rendered = renderNestedFor(rendered, options);

  //Thêm hỗ trợ cho câu lệnh for
  rendered = renderFor(rendered, options);

  // If lồng trong if else
  const ifRegex = /21575{\s*if\s+(\w+)\s*}([\s\S]*?){\s*\/if\s*}/gs;
  while ((match = ifRegex.exec(rendered)) !== null) {
    const [fullMatch, condition, ifContent, elseContent] = match;
    const value = options[condition];
    // Thực hiện thay thế nội dung dựa trên điều kiện
    const replacement = value ? ifContent : elseContent || "";
    rendered = rendered.replace(fullMatch, replacement);
  }

  // Phân chia template

  return callback(null, rendered);
};
module.exports = renderTemplate;