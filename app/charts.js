function summaryGroup(ndx)
{
  return ndx.groupAll().reduce(
    function(p, v) {
      p.registered++
      p.resultSum += v.result;

      if (v.result) {
        if (!p.results[v.result]) {
          p.results[v.result] = 0;
        }
        p.results[v.result]++;
      }

      if (v.formattedResult == 'DNS') {
        p.didNotStart++;
      } else if (v.formattedResult == 'DNF') {
        p.didNotFinish++;
      } else if (v.formattedResult == 'DQ') {
        p.disqualified++;
      }

      return p;
    },
    function(p, v) {
      p.registered--
      p.resultSum -= v.result;

      if (v.result) {
        p.results[v.result]--;
        if (!p.results[v.result]) {
          delete p.results[v.result];
        }
      }

      if (v.formattedResult == 'DNS') {
        p.didNotStart--;
      } else if (v.formattedResult == 'DNF') {
        p.didNotFinish--;
      } else if (v.formattedResult == 'DQ') {
        p.disqualified--;
      }
      return p;
    },
    function() {
      return {
        registered: 0,
        disqualified: 0,
        didNotFinish: 0,
        didNotStart: 0,
        resultSum: 0,
        results: {},
        fastest: function() {
          return parseFloat(d3.min(Object.keys(this.results), parseFloat));
        },
        slowest: function() {
          return parseFloat(d3.max(Object.keys(this.results), parseFloat));
        }
      };
    }
  );
}

function registeredChart(all)
{
  return numberChart('.summary .registered', function(d) {
    return d.registered;
  }, all)
    .html({
      none: 'No one was registered',
      one: 'One person registered',
      some: '%number person registered'
    })
  ;
}

function numberChart(selector, accessor, group)
{
  return dc
    .numberDisplay(selector)
    .valueAccessor(accessor)
    .group(group)
    .formatNumber(d3.format('f'))
    ;
}

function participantsChart(all)
{
  return numberChart('.summary .participant', function(d) {
    return d.registered - d.didNotStart;
  }, all)
    .html({
      none: 'and no one started the race.',
      one: 'and one person started the race.',
      some: 'and %number person started the race.'
    })
  ;
}

function didNotFinishChart(all)
{
  return numberChart('.summary .didNotFinish', function(d) {
    return d.didNotFinish;
  }, all)
    .html({
      none: 'Everybody finished the race',
      one: 'One person did not finished',
      some: '%number participant did not finished the race'
    })
  ;
}

function disqualifiedChart(all)
{
  return numberChart('.summary .disqualified', function(d) {
    return d.disqualified;
  }, all)
    .html({
      none: 'and nobody was disqualified.',
      one: 'and one person was disqualified.',
      some: 'and %number people was disqualified.'
    })
  ;
}

function fastestChart(all)
{
  return numberChart('.summary .fastest', function(d) {
    return d.fastest();
  }, all)
    .formatNumber(formatTime)
    .html({one: 'The fastest racer made in %number'})
  ;
}

function persistentChart(all)
{
  return numberChart('.summary .persistent', function(d) {
    return d.slowest();
  }, all)
    .formatNumber(formatTime)
    .html({one: 'and the persistent participant made in %number'})
  ;
}

function averageResultChart(all)
{
  return numberChart('.summary .average', function(d) {
    return d.resultSum / (d.registered - d.didNotStart - d.didNotFinish - d.disqualified);
  }, all)
    .formatNumber(formatTime)
    .html({one: 'so the average time is %number.'})
  ;
}

function categoryChart(ndx)
{
  return pieChart('#categoryChart', ndx.dimension(categoryFormatter));
}

function categoryFormatter(d)
{
  if (d.category == 'E') {
    return 'Elit';
  } else if (d.category == 'C') {
    return 'Competative';
  } else if (d.category == 'O') {
    return 'Open';
  }

  return d.category;
}

function pieChart(name, dimension)
{
  return dc.pieChart(name)
    .slicesCap(4)
    .dimension(dimension)
    .group(dimension.group())
    ;
}

function sexChart(ndx)
{
  return pieChart('#sexChart', ndx.dimension(sexFormatter));
}

function sexFormatter(d)
{
  if (d.sex == 'M') {
    return 'Male';
  } else if (d.sex == 'F') {
    return 'Female';
  }

  return d.sex;
}

function teamChart(ndx)
{
  var
    dimension = ndx.dimension(function(d) {
      if (!d.team) {
        return '#Indiviual#';
      }
      return d.team;
    })
    ;

  return pieChart('#teamChart', dimension);
}

function countryChart(ndx)
{
  var
    dimension = ndx.dimension(function(d) {
      return d.nationality;
    })
    ;

  return pieChart('#countryChart', dimension);
}

function resultChart(ndx, all)
{
  var
    fastest = Math.round(all.value().fastest() / 5) * 5,
    slowest = Math.round(all.value().slowest() / 5) * 5,
    tickStepping = (slowest - fastest) / 10,
    chart = dc.barChart("#resultChart"),
    dimension = ndx.dimension(function(d) {
      if (!d.result) {
        return slowest;
      }

      return Math.round(d.result / 5) * 5;
    }) ;
  tickStepping = Math.ceil(tickStepping / 5) * 5;

  chart
    .xAxisPadding('0.001%')
    .xAxis()
    .tickFormat(formatTime);

  chart
    .yAxis()
    .tickFormat(d3.format('d'))
    ;

  return chart
    .dimension(dimension)
    .group(dimension.group())
    .x(d3.scale.linear().domain([fastest, slowest]))
    .centerBar(true)
    .elasticX(true)
    .elasticY(true)
    .width(1000)
    ;
}

function formatTime(time)
{
  var
    f = d3.format('02f'),
    hours = time / 60,
    mins = hours - Math.floor(hours),
    secs = time - Math.floor(time)
    ;

  return f(Math.floor(hours)) + ':' + f(Math.floor(mins * 60)) + ':' + f(secs * 60);
}

function ageChart(ndx)
{
  var
    dimension = ndx.dimension(function(d) {
      return d.age;
    });

  var chart = dc.barChart("#ageChart");

  chart
    .xAxisPadding('0.001%')
    .yAxis()
    .tickFormat(d3.format('d'))
    ;

  return chart
    .dimension(dimension)
    .group(dimension.group())
    .x(d3.scale.linear().domain([0,1]))
    .centerBar(true)
    .elasticX(true)
    .elasticY(true)
    .width(1000)
    ;
}

function entityChart(ndx, dimension, all)
{
  var
    chart = dc.dataTable("#entityChart table")
    slowest = all.value().slowest(),
    page = 0,
    maxPage = 1,
    pageSize = 20
  ;

  chart
    .dimension(dimension)
    .group(function(d) {return ''; })
    .sortBy(function(d) {
      if (d.formattedResult == 'DQ') {
        return slowest + 1;
      } else if (d.formattedResult == 'DNF') {
        return slowest + 2;
      } else if (d.formattedResult == 'DNS') {
        return slowest + 3;
      }

      return d.result;
    })
    .width(1000)
    .size(Infinity)
    .beginSlice(0)
    .endSlice(pageSize)
    .columns([
      {
        label: 'Rank',
        format: function(d) { return ''; }
      },
      {
        label: 'Overall Rank',
        format: function(d) { return d.result ? d.rank : '-'; }
      },
      {
        label: 'BIB',
        format: function(d) { return d.bib; }
      },
      {
        label: 'Name',
        format: function(d) { return d.name; }
      },
      {
        label: 'Sex',
        format: sexFormatter
      },
      {
        label: 'Category',
        format: categoryFormatter
      },
      {
        label: 'Birth',
        format: function(d) { return d.birth; }
      },
      {
        label: 'Nationality',
        format: function(d) { return d.nationality; }
      },
      {
        label: 'City',
        format: function(d) { return d.city; }
      },
      {
        label: 'Team',
        format: function(d) { return d.team; }
      },
      {
        label: 'Result',
        format: function(d) { return d.formattedResult; }
      }
    ])
    .on('renderlet', function(chart) {
      chart
        .selectAll('.dc-table-column._0')
        .data(d3.range(page * pageSize + 1, page * pageSize + pageSize + 1))
        .text(function(d) {
          return d;
        })
        ;
    })
    ;

  function next() {
    page++;
    update();
    chart.redraw();
  }
  function update() {
    chart.beginSlice(pageSize * page);
    chart.endSlice(pageSize * page + pageSize);
    display();
  }
  function display() {
    var
      pages,
      firstPage = page < 11 ? 1 : page >= maxPage - 11 ? maxPage - 20 : page - 10,
      lastPage = page + 11 > maxPage ? maxPage : page <= 10 ? 21 : page + 11
    ;

    d3.select('#entityChart .first')
      .attr('disabled', page == 0 ? 'true' : null);
    d3.select('#entityChart .prev')
      .attr('disabled', page == 0 ? 'true' : null);
    d3.select('#entityChart .next')
      .attr('disabled', page == maxPage-1 ? 'true' : null);
    d3.select('#entityChart .last')
      .attr('disabled', page == maxPage-1 ? 'true' : null);
    (pages = d3.select('#entityChart .pages')
      .selectAll('span')
      .data(d3.range(firstPage, lastPage)))
      .enter()
        .append('span')
      ;
    pages
      .classed('active', function(d) {
        return d == page + 1
      })
      .text(function(d) { return d})
      .on('click', function(newPage) {
        page = newPage - 1
        update();
        chart.redraw();
      })
      .exit()
        .remove()
    ;
  }
  function prev() {
    page--;
    update();
    chart.redraw();
  }
  function first() {
    page = 0;
    update();
    chart.redraw();
  }
  function last() {
    page = maxPage - 1;
    update();
    chart.redraw();
  }

  var originalRender = chart.render;
  chart.render = function() {
    originalRender.apply(chart, arguments);
    createButton('#entityChart', 'first', '<<', first);
    createButton('#entityChart', 'prev', '<', prev);
    d3
      .select('#entityChart')
      .append('div')
      .classed('pages', true)
    ;
    createButton('#entityChart', 'next', '>', next);
    createButton('#entityChart', 'last', '>>', last);
    update();
    return chart;
  };
  chart.resetPage = function() {
    maxPage = Math.ceil(all.value().registered / pageSize);
    page = 0;
    update();
    chart.redraw();
    return chart;
  }

  return chart;
}

function createButton(parent, cls, text, click)
{
    return d3
      .select(parent)
      .append('button')
        .attr('class', cls)
        .text(text)
        .on('click', click)
}
