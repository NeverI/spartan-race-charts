function xlsUploader()
{
  var input = document.getElementById('inputFile');
  input.addEventListener('change', function(event) {
    if (!input.files[0]) {
      return;
    }

    loadXlsFile(input.files[0], new Date());
  });

  return input;
}

function loadXlsFile(file, raceDate)
{
    var reader = new FileReader();
    reader.onload = function(event) {
      var
        data = parseXls(event.target.result, raceDate),
        event = new Event('xlsParsed')
      ;

      event.data = data;
      document.getElementById('inputFile').dispatchEvent(event);
    }

    reader.readAsBinaryString(file);
}

function parseXls(content, raceDate)
{
  var
    cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'],
    workbook = XLSX.read(content, {type: 'binary'}),
    sheet = workbook.Sheets[workbook.SheetNames[0]],
    data = [],
    rowIndex = sheet.A1.w == 1 ? 1 : 2,
    colIndex = undefined,
    cellParser = undefined,
    row = undefined
  ;

  if (sheet.F2.w.length == 2) {
    cellParser = cellParser2;
  } else {
    cellParser = cellParser1;
  }

  while(rowIndex <= sheet['!range'].e.r) {
    row = {};
    colIndex = 0;

    while(colIndex <= sheet['!range'].e.c) {
      if (sheet[cols[colIndex] + rowIndex] === undefined) {
        colIndex++;
        continue;
      }

      cellParser(cols[colIndex], sheet[cols[colIndex] + rowIndex].v, row, raceDate);

      colIndex++;
    }

    data.push(row);
    rowIndex++;
  }

  return data;
}

function cellParser1(column, value, row, raceDate)
{
    switch(column) {
      case 'A':
        return row.rank = parseInt(value);
      case 'D':
        return row.bib = value;
      case 'E':
        return row.name = value;
      case 'F':
        return row.sex = value;
      case 'G':
        return row.category = value[0];
      case 'H':
        row.birth = parseBirth(value);
        return row.age = getAge(row.birth, raceDate);
      case 'I':
        return row.city = value;
      case 'J':
        return row.team = value;
      case 'K':
        return row.nationality = value;
      case 'L':
        row.formattedResult = value;
        return row.result = parseTime(row.formattedResult);
    }
}

function parseBirth(date)
{
  var
    format = d3.format('02f'),
    parsed = date.match(/^(\d\d?)[\/\.](\d\d?)[\/\.](\d{4})$/);
  if (parsed) {
    return parsed[3] + '-' + format(parsed[1]) + '-' + format(parsed[2]);
  }

  parsed = date.match(/^(\d{4})[\/\.-](\d\d?)[\/\.-](\d\d?)$/)

  if (parsed) {
    return parsed[1] + '-' + format(parsed[2]) + '-' + format(parsed[3]);
  }

  throw new Error('Unknown date format: ' + date);
}

function getAge(birthString, raceDate)
{
  var
    birth = new Date(birthString),
    birthYearMonthAndDay = new Date()
  ;
  birthYearMonthAndDay.setYear(new Date(birth.getFullYear()));

  return raceDate.getFullYear() - birth.getFullYear() - (birth > birthYearMonthAndDay ? 0 : 1);
}

function parseTime(time)
{
  var parsed = time.split(':');
  if (parsed.length != 3) {
    return 0;
  }

  return parsed[0] * 60 + parsed[1] * 1 + (parsed[2] / 60);
}

function cellParser2(column, value, row, raceDate)
{
    switch(column) {
      case 'A':
        return row.rank = parseInt(value);
      case 'D':
        return row.bib = value;
      case 'F':
        row.category = value[0];
        return row.sex = value[1] == 'M' ? 'M' : 'F';
      case 'G':
        row.birth = parseBirth(value);
        return row.age = getAge(row.birth, raceDate);
      case 'H':
        return row.city = value;
      case 'I':
        return row.team = value;
      case 'J':
        return row.nationality = value;
      case 'K':
        row.formattedResult = value;
        return row.result = parseTime(row.formattedResult);
    }
}
