using Api.Tests.Integration;
using Xunit;

namespace UniTrade.Tests.Integration;

[CollectionDefinition("DatabaseCollection")]
public sealed class DatabaseCollectionDefinition : ICollectionFixture<DbFixture> { }
