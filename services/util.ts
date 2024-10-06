export async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getDurationString(duration: number) {
  const estimateInSeconds = Math.floor(duration / 1000);
  const minutes = Math.floor(estimateInSeconds / 60);
  const seconds = estimateInSeconds % 60;

  return `${minutes > 0 ? `${minutes}m, ` : ""}${seconds}s`;
}

export function downloadStringToFile(filename: string, text: string) {
  const element = document.createElement("a");

  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text),
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

export function objArrayToCsvString<T extends Object>(
  objArray: Array<T>,
  columns?: Array<keyof T>,
): string {
  if (objArray.length == 0) {
    return "";
  }

  columns = columns ?? (Object.keys(objArray[0]) as Array<keyof T>);

  const output = columns.join(",");
  const lines: string[] = [];

  objArray.forEach((obj) => {
    const line = columns!
      .map((key) => {
        const value = obj[key];

        return value !== undefined && value !== null && typeof value != "object"
          ? '"' + value.toString().replace(/"/g, '""') + '"'
          : "";
      })
      .join(",");

    lines.push(line);
  });

  return output + "\n" + lines.join("\n");
}

export function downloadObjArrayAsCsv<T extends Object>(
  filename: string,
  objArray: Array<T>,
  columns?: Array<keyof T>,
) {
  downloadStringToFile(filename, objArrayToCsvString(objArray, columns));
}
