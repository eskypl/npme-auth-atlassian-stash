# npme-auth-atlassian-stash

Atlassian Stash authentication and authorization strategy for
npm Enterprise.

## Installation

Install `npme-auth-atlassian-stash` were you have installed npmE.
By default npmE is installed in `/etc/npme`.

```
npm install npme-auth-atlassian-stash
```

## Configuration

This module will use `.stashrc` file which yous should create in the
main directory of npmE. Example configuration:

```
host=https://stash.domain.com
user=npme
pass=npmepass
logFile=/etc/npme/logs/npme-auth-atlassian-stash.log
logLevel=error
```

* **host**: your Stash repository
* **name**: Stash user login used for Basic authorization
* **pass**: Stash user password
* **logFile**: location of module log file
* **logLevel**: logging level

### Stash user

`npme-auth-atlassian-stash` will use Stash account to get information
about users, groups, projects and repositories. This account should
be created only for the purpose of `npme-auth-atlassian-stash` and
should have administrative privilages to be able to acquire needed
information.

### License

Copyright (c) 2015 eSKY.pl S.A. (http://it.esky.pl)
Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
