using System;
using System.Collections.Generic;

namespace GenshinSchedule.SyncServer.Database
{
    public class DbUser
    {
        public int Id { get; set; }

        public string Username { get; set; }
        public byte[] Password { get; set; }
        public DateTime CreatedTime { get; set; }

        public DbWebData WebData { get; set; }
        public List<DbNotification> Notifications { get; set; }
    }
}