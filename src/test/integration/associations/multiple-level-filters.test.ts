'use strict';

import * as chai from 'chai';
import DataTypes from '../../../lib/data-types';
import Support from '../support';
const expect = chai.expect;

describe(Support.getTestDialectTeaser('Multiple Level Filters'), () => {
  it('can filter through belongsTo', function() {
    const User = this.sequelize.define('User', {username: new DataTypes.STRING() });
    const Task = this.sequelize.define('Task', {title: new DataTypes.STRING() });
    const Project = this.sequelize.define('Project', { title: new DataTypes.STRING() });

    Project.belongsTo(User);
    User.hasMany(Project);

    Task.belongsTo(Project);
    Project.hasMany(Task);

    return this.sequelize.sync({ force: true }).then(() => {
      return User.bulkCreate([{
        username: 'leia'
      }, {
        username: 'vader'
      }]).then(() => {
        return Project.bulkCreate([{
          UserId: 1,
          title: 'republic'
        }, {
          UserId: 2,
          title: 'empire'
        }]).then(() => {
          return Task.bulkCreate([{
            ProjectId: 1,
            title: 'fight empire'
          }, {
            ProjectId: 1,
            title: 'stablish republic'
          }, {
            ProjectId: 2,
            title: 'destroy rebel alliance'
          }, {
            ProjectId: 2,
            title: 'rule everything'
          }]).then(() => {
            return Task.findAll({
              include: [
                {
                  model: Project,
                  include: [
                    {model: User, where: {username: 'leia'}},
                  ],
                  required: true
                },
              ],
              order : ['id']
            }).then(tasks => {
              expect(tasks.length).to.be.equal(2);
              expect(tasks[0].title).to.be.equal('fight empire');
              expect(tasks[1].title).to.be.equal('stablish republic');
            });
          });
        });
      });
    });
  });

  it('avoids duplicated tables in query', function() {
    const User = this.sequelize.define('User', {username: new DataTypes.STRING() });
    const Task = this.sequelize.define('Task', {title: new DataTypes.STRING() });
    const Project = this.sequelize.define('Project', { title: new DataTypes.STRING() });

    Project.belongsTo(User);
    User.hasMany(Project);

    Task.belongsTo(Project);
    Project.hasMany(Task);

    return this.sequelize.sync({ force: true }).then(() => {
      return User.bulkCreate([{
        username: 'leia'
      }, {
        username: 'vader'
      }]).then(() => {
        return Project.bulkCreate([{
          UserId: 1,
          title: 'republic'
        }, {
          UserId: 2,
          title: 'empire'
        }]).then(() => {
          return Task.bulkCreate([{
            ProjectId: 1,
            title: 'fight empire'
          }, {
            ProjectId: 1,
            title: 'stablish republic'
          }, {
            ProjectId: 2,
            title: 'destroy rebel alliance'
          }, {
            ProjectId: 2,
            title: 'rule everything'
          }]).then(() => {
            return Task.findAll({
              include: [
                {
                  model: Project,
                  include: [
                    {model: User, where: {
                      username: 'leia',
                      id: 1
                    }},
                  ],
                  required: true
                },
              ],
              order : ['id']
            }).then(tasks => {
              expect(tasks.length).to.be.equal(2);
              expect(tasks[0].title).to.be.equal('fight empire');
              expect(tasks[1].title).to.be.equal('stablish republic');
            });
          });
        });
      });
    });
  });

  it('can filter through hasMany', function() {
    const User = this.sequelize.define('User', {username: new DataTypes.STRING() });
    const Task = this.sequelize.define('Task', {title: new DataTypes.STRING() });
    const Project = this.sequelize.define('Project', { title: new DataTypes.STRING() });

    Project.belongsTo(User);
    User.hasMany(Project);

    Task.belongsTo(Project);
    Project.hasMany(Task);

    return this.sequelize.sync({ force: true }).then(() => {
      return User.bulkCreate([{
        username: 'leia'
      }, {
        username: 'vader'
      }]).then(() => {
        return Project.bulkCreate([{
          UserId: 1,
          title: 'republic'
        }, {
          UserId: 2,
          title: 'empire'
        }]).then(() => {
          return Task.bulkCreate([{
            ProjectId: 1,
            title: 'fight empire'
          }, {
            ProjectId: 1,
            title: 'stablish republic'
          }, {
            ProjectId: 2,
            title: 'destroy rebel alliance'
          }, {
            ProjectId: 2,
            title: 'rule everything'
          }]).then(() => {
            return User.findAll({
              include: [
                {
                  model: Project,
                  include: [
                    {model: Task, where: {title: 'fight empire'}},
                  ],
                  required: true
                },
              ],
              order : ['id']
            }).then(users => {
              expect(users.length).to.be.equal(1);
              expect(users[0].username).to.be.equal('leia');
            });
          });
        });
      });
    });
  });

  it('can filter through hasMany connector', function() {
    const User = this.sequelize.define('User', {username: new DataTypes.STRING() });
    const Project = this.sequelize.define('Project', { title: new DataTypes.STRING() });

    Project.belongsToMany(User, {through: 'user_project'});
    User.belongsToMany(Project, {through: 'user_project'});

    return this.sequelize.sync({ force: true }).then(() => {
      return User.bulkCreate([{
        username: 'leia'
      }, {
        username: 'vader'
      }]).then(() => {
        return Project.bulkCreate([{
          title: 'republic'
        }, {
          title: 'empire'
        }]).then(() => {
          return User.findById(1).then(user => {
            return Project.findById(1).then(project => {
              return user.setProjects([project]).then(() => {
                return User.findById(2).then(_user => {
                  return Project.findById(2).then(_project => {
                    return _user.setProjects([_project]).then(() => {
                      return User.findAll({
                        include: [
                          {model: Project, where: {title: 'republic'}},
                        ],
                        order : ['id']
                      }).then(users => {
                        expect(users.length).to.be.equal(1);
                        expect(users[0].username).to.be.equal('leia');
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
