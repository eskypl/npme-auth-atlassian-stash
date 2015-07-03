# npme-auth-stash

Atlassian Stash authentication and authorization strategy for npm Enterprise.

## Installation

You should install `npme-auth-atlassian-stash` inside `node_modules` directory of npmE. Probably this will
be `/etc/npme/node_modules`.

## Configuration

This module will use `.stashrc` file which yous should create in the main directory of npmE.

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



### Log file
