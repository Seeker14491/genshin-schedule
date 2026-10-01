using GenshinSchedule.SyncServer.Database;
using Newtonsoft.Json.Linq;

namespace GenshinSchedule.SyncServer.Models;

public class WebData
{
    public Guid Token { get; set; }
    public JObject Data { get; set; } = new();

    public static WebData FromDbModel(DbWebData data) => new()
    {
        Token = data.Token,
        Data  = JObject.Parse(data.Data ?? "{}")
    };
}
