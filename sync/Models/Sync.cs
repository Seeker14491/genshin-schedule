using Microsoft.AspNetCore.JsonPatch;
using Newtonsoft.Json.Linq;

namespace GenshinSchedule.SyncServer.Models;

public class SyncRequest
{
    public Guid Token { get; set; }
    public JsonPatchDocument<JObject>? Patch { get; set; }
}

public class SyncResponse
{
    public Guid Token { get; set; }
}
