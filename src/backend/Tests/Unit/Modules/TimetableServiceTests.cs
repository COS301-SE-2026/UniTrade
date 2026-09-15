using System;
using System.Threading;
using Docker.DotNet.Models;
using Modules.Timetable;
using Modules.Timetable.Models;
using Modules.Timetable.Models.Dto;
using Modules.Timetable.Repositories;
using Moq;
using Xunit;
using System.Threading.Tasks;

namespace UniTrade.Tests.Unit.Modules;

[Trait("Category", "Unit")]
public class TimetableServiceTests
{
    private readonly Mock<ITimetableRepository> _mock = new();
    private readonly TimetableService _sut;

    public TimetableServiceTests()
    {
        _sut = new TimetableService(_mock.Object);
    }

    [Theory]
    [InlineData(-1, "10:00", "11:00")]
    [InlineData(7, "10:00", "11:00")]
    [InlineData(1, "11:00", "10:00")]
    [InlineData(1, "07:59", "11:00")]
    [InlineData(1, "10:00", "20:01")]
    [InlineData(1, "supa_invalid", "11:00")]
    [InlineData(1, "10:00", "")]
    public void ParseAndValidate_RejectsInvalidRanges(int day, string start, string end)
    {
        var exception = Assert.Throws<TimetableException>(() =>
            TimetableService.Parse_Validate(
                new CreateTimetableEntryDto
                {
                    DayOfWeek = day,
                    StartTime = start,
                    EndTime = end,
                }
            )
        );
        Assert.Equal(TimetableErrors.InvalidTimeRange, exception.Message);
    }

    [Fact]
    public void ParseAndValidate_AcceptsWindowEdges()
    {
        var (start, end) = TimetableService.Parse_Validate(
            new CreateTimetableEntryDto
            {
                DayOfWeek = 0,
                StartTime = "08:00",
                EndTime = "20:00",
            }
        );

        Assert.Equal(new TimeOnly(8, 0), start);
        Assert.Equal(new TimeOnly(20, 0), end);
    }

    [Fact]
    public async Task AddAsync_PersistsValidEntry()
    {
        _mock
            .Setup(r => r.AddAsync(It.IsAny<TimetableEntry>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                (TimetableEntry e, CancellationToken _) =>
                {
                    e.EntryId = Guid.NewGuid();
                    e.CreatedAt = DateTime.UtcNow;
                    return e;
                }
            );

        var res = await _sut.AddAsync(
            Guid.NewGuid(),
            new CreateTimetableEntryDto
            {
                DayOfWeek = 1,
                StartTime = "10:00",
                EndTime = "11:00",
            }
        );

        Assert.Equal(1, res.DayOfWeek);
        Assert.Equal("10:00", res.StartTime);
        Assert.Equal("11:00", res.EndTime);
        _mock.Verify(
            r => r.AddAsync(It.IsAny<TimetableEntry>(), It.IsAny<CancellationToken>()),
            Times.Once
        );
    }

    [Fact]
    public async Task RemoveAsync_ThrowsWhenNotOwned()
    {
        var entryId = Guid.NewGuid();
        _mock
            .Setup(r =>
                r.DeleteOwnedAsync(entryId, It.IsAny<Guid>(), It.IsAny<CancellationToken>())
            )
            .ReturnsAsync(false);

        var exception = await Assert.ThrowsAsync<TimetableException>(() =>
            _sut.DeleteAsync(Guid.NewGuid(), entryId)
        );
        Assert.Equal(TimetableErrors.EntryNotFound, exception.Message);
    }
}
