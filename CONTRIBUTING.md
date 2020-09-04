# Overview

FinChat-Web is a community driven open source project and we welcome any contributor!

If you think something should be changed or added, please open an issue to discuss the change. You can open a PR if you want to be explicit about the change, but the change may need extensive discussion and possibly revision before it is accepted.

Feedback is welcome, feel free to open issue for any problem

# Development Environment

TODO

# Style Guide

TODO

# Workflow

## Setup process

### step 1: Fork in the cloud

1. Visit https://github.com/finogeeks/FinChat-Web
2. On the top right of the page, click the `Fork` button (top right) to create a cloud-based fork of the repository.

### step 2: Clone fork to local storage

```sh
mkdir -p $working_dir
cd $working_dir
git clone https://github.com/$user/FinChat-Web.git
# or: git clone git@github.com:$user/FinChat-Web.git

cd $working_dir/FinChat-Web
git remote add upstream https://github.com/finogeeks/FinChat-Web.git
# or: git remote add upstream git@github.com:finogeeks/FinChat-Web.git

# Confirm that your remotes make sense:
# It should look like:
# origin    git@github.com:$(user)/FinChat-Web.git (fetch)
# origin    git@github.com:$(user)/FinChat-Web.git (push)
# upstream  https://github.com/finogeeks/FinChat-Web (fetch)
# upstream  https://github.com/finogeeks/FinChat-Web (push)
git remote -v
```

## Develop process

The overview of develop process is as follows:

<img src="docs/dev/git/contribution_dev_process.jpg" alt="develop process" width="650px">

### step 1: Branch

```sh
cd $working_dir/FinChat-Web
# Keep your branch in sync
git fetch upstream
git checkout develop
git rebase upstream/develop
```

Branch from develop:

```sh
git checkout -b my_feature
```

### Step 2: Develop

#### Edit the code

You can now edit the code on the `my_feature` branch.

#### Build && Run FinChat-Web

```sh
# Project setup
yarn install

# Compiles and hot-reloads for development
yarn run serve

# Compiles and minifies for production
yarn run build
```

#### Test

```sh
# Run your tests
yarn run test

# Lints and fixes files
yarn run lint

# Customize configuration
# See https://cli.vuejs.org/config/
```

#### commit

Commit your changes.

```sh
git commit
```

Likely you'll go back and edit/build/test further, and then `commit --amend` in a
few cycles.

### Step 3: Keep your branch in sync

```sh
# While on your myfeature branch.
git fetch upstream
git rebase upstream/develop
```

Please don't use `git pull` instead of the above `fetch`/`rebase`. `git pull`
does a merge, which leaves merge commits. These make the commit history messy
and violate the principle that commits ought to be individually understandable
and useful (see below). You can also consider changing your `.git/config` file
via `git config branch.autoSetupRebase` always to change the behavior of `git pull`.

### Step 4: Push

When the changes are ready to review (or you just to create an offsite backup
or your work), push your branch to your fork on `github.com`:

```sh
git push origin my_feature
# or: git push --set-upstream ${your_remote_name} my_feature
```

### Step 5: Create a pull request

1. Visit your fork at `https://github.com/$user/FinChat-Web`.
2. Click the `Compare & Pull Request` button next to your `my_feature` branch.
3. Fill in the required information in the PR template.

#### Get a code review

If your pull request (PR) is opened, it will be assigned to one or more
reviewers. Those reviewers will do a thorough code review, looking at
correctness, bugs, opportunities for improvement, documentation and comments,
and style.

To address review comments, you should commit the changes to the same branch of
the PR on your fork

# Notes for maintainers on merging PRs etc

There are some notes for those with commit access to the project on how we manage git [here](docs/dev/git/git.md).