function xlsUploader()
{
  var input = document.getElementById('inputFile');
  input.addEventListener('change', function(event) {
    if (!input.files[0]) {
      return;
    }

    var reader = new FileReader();
    reader.onload = function(event) {
      var
        data = parseXls(event.target.result, new Date()),
        event = new Event('xlsParsed')
      ;

      event.data = data;
      input.dispatchEvent(event);
    }

    reader.readAsBinaryString(input.files[0]);
  });

  return input;
}

function parseXls(content, raceDate)
{
    var
      workbook = XLSX.read(content, {type: 'binary'}),
      sheet = workbook.Sheets[workbook.SheetNames[0]],
      dateFormatter = d3.format('02f'),
      data = [],
      skipFirstRow = undefined,
      row = undefined
    ;

    for (var cell in sheet) {
      var
        col = cell[0],
        rowNumb = cell.substr(1, cell.length)
      ;

      if (skipFirstRow === undefined && cell == 'A1' && sheet[cell].w != 1) {
        skipFirstRow = true;
      }
      if (rowNumb == 1 && skipFirstRow) {
        continue;
      }

      if (col == 'A') {
        if (row) {
          data.push(row);
        }
        row = {};
      }

      switch(col) {
        case 'A':
          row.rank = parseInt(sheet[cell].w);
          break
        case 'D':
          row.bib = sheet[cell].w;
          break
        case 'E':
          row.name = sheet[cell].w;
          break
        case 'F':
          row.sex = sheet[cell].w;
          break
        case 'G':
          row.category = sheet[cell].w[0];
          break
        case 'H':
          row.birth = parseBirth(sheet[cell].w, dateFormatter);

          birth = new Date(row.birth);
          birthYearMonthAndDay = new Date();
          birthYearMonthAndDay.setYear(new Date(birth.getFullYear()));

          row.age = raceDate.getFullYear() - birth.getFullYear() - (birth > birthYearMonthAndDay ? 0 : 1)
          if (!row.age) {
            console.log(row, birthYearMonthAndDay);
          }
          break
        case 'I':
          row.city = sheet[cell].w;
          break
        case 'J':
          row.team = sheet[cell].w;
          break
        case 'K':
          row.nationality = sheet[cell].w;
          break
        case 'L':
          row.formattedResult = sheet[cell].w;
          row.result = parseTime(row.formattedResult);
          break
      }
    }

    data.push(row);

    return data;
}

function parseBirth(date, format)
{
  var parsed = date.match(/^(\d\d?)[\/\.](\d\d?)[\/\.](\d{4})$/);
  if (parsed) {
    return parsed[3] + '-' + format(parsed[1]) + '-' + format(parsed[2]);
  }

  parsed = date.match(/^(\d{4})[\/\.-](\d\d?)[\/\.-](\d\d?)$/)

  if (parsed) {
    return parsed[1] + '-' + format(parsed[2]) + '-' + format(parsed[3]);
  }

  throw new Error('Unknown date format: ' + date);
}

function parseTime(time)
{
  var parsed = time.split(':');
  if (parsed.length != 3) {
    return 0;
  }

  return parsed[0] * 60 + parsed[1] * 1 + (parsed[2] / 60);
}
