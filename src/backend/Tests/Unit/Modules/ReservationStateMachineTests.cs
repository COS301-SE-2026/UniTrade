using Modules.Reservations;
using Modules.Reservations.Repositories;
using Modules.Reservations.StateMachine;
using Xunit;
using Modules.Reservations.Models.Dto;
using System;


namespace Tests.Unit.Modules.ReservationStateMachineTests;

[Trait("Category", "Unit")]
public class ReservationStateMachineTests
{

    private static readonly DateTime Now=new DateTime(2026,7,29,12,0,0,DateTimeKind.Utc);
    //sharedhelper

    private static Reservation MakeRSV(ReservationState status=ReservationState.Active, Guid? sellerId=null,Guid? buyerId=null, DateTime? sellerAcknowledgedAt=null,DateTime? meetupConfirmedAt=null,DateTime? buyerRespondedt,DateTime? expiresAt=null)
    {
        return new Reservation
        {
            ReservationId=Guid.NewGuid(),
            ListingId=Guid.NewGuid(),
            BuyerId=buyerId ?? Guid.NewGuid(),
            SellerId=sellerId ?? Guid.NewGuid(),
            ReservationStatus=status,
            SellerAcknowledgedAt=sellerAcknowledgedAt,
            BuyerRespondedAt=buyerRespondedt,
            MeetupConfirmedAt=meetupConfirmedAt,
            ExpiresAt=expiresAt ?? Now.AddHours(24),
            CreatedAt=Now.AddDays(-1),     
        };
    }
//derivetimestage
    [Fact]
    public void DeriveTimerStage_MeetUpConfirmAtSet_ReturnItConfirmed()
    {
        var r= MakeRSV(
            sellerAcknowledgedAt: Now.AddHours(-3),
            buyerRespondedt: Now.AddHours(-2),
            meetupConfirmedAt: Now.AddHours(-1)
        );
        var testAgainstStages= ReservationStateMachine.DeriveTimerStage(r);

        Assert.Equal(TimerStages.MeetupConfirmed,testAgainstStages);
    }

    [Fact]
    public void DeriveTimerStage_BuyerRespondedSetMeetupNulled_ReturnCoordinating()
    {
        var r= MakeRSV(
            sellerAcknowledgedAt: Now.AddHours(-3),
            buyerRespondedt: Now.AddHours(-2),
            meetupConfirmedAt: null
        );
        var testAgainstStages= ReservationStateMachine.DeriveTimerStage(r);

        Assert.Equal(TimerStages.MeetupConfirmed,testAgainstStages);
    }

    [Fact]
    public void DeriveTimerStage_SellerAcknowledgedatSetMeetupNulled_ReturnAwaitingBuyer()
    {
        var r= MakeRSV(
            sellerAcknowledgedAt: Now.AddHours(-24),
            buyerRespondedt: null,
            meetupConfirmedAt: Now.AddHours(-24)
        );
        var testAgainstStages= ReservationStateMachine.DeriveTimerStage(r);

        Assert.Equal(TimerStages.MeetupConfirmed,testAgainstStages);
    }

    [Fact]
    public void DeriveTimerStage_NonSet_ReturnAwaitingSeller()
    {
        var r= MakeRSV(
            sellerAcknowledgedAt: null,
            buyerRespondedt: null,
            meetupConfirmedAt: null
        );
        var testAgainstStages= ReservationStateMachine.DeriveTimerStage(r);

        Assert.Equal(TimerStages.MeetupConfirmed,testAgainstStages);
    }
    


    //ack
    [Fact]
    public async Task Acknowledge_CallerNotSeller_ThrowForbidden()
    {
        var sellerid=Guid.NewGuid();
        var someOneElse=Guid.NewGuid();
        var r=MakeRSV(
            sellerId: sellerid
        );

        Assert.Throws<ReservationException.ReservationErrors.Forbidden>(()=> ReservationStateMachine.Acknowledge(r,someOneElse,DateTime.now));
   }

    //reservation not active should throw notactive
    [Fact]
    public async Task Acknowledge_RSVnotActive_ThrowNotActive()
    {
        var sellerid=Guid.NewGuid();
        //var someOneElse=Guid.NewGuid();
        var r=MakeRSV(
            sellerid: null,
            status:ReservationStatus.Cancelled
        );

        Assert.Throws<ReservationException.ReservationErrors.NotActive>(()=> ReservationStateMachine.Acknowledge(r,sellerid,DateTime.now));
    }

    [Fact]
    public async Task Acknowledge_SellerAck_ThrowAlreadyAck()
    {
        var sellerid=Guid.NewGuid();
        var r=MakeRSV(
            sellerId: sellerid,
            sellerAcknowledgedAt: DateTime.now.AddHours(-5);

        );

        Assert.Throws<ReservationException.ReservationErrors.AlreadyAcknowledged>(()=> ReservationStateMachine.Acknowledge(r,sellerid,DateTime.now));
    }

    //selleracknowedat throws alreadyacknowledeged

    //sellerackat=now
    [Fact]
    public async Task Acknowledge_ValidCall_SetSellerAckAtNowPushExpiresAt()
    {
        var sellerid=Guid.NewGuid();
        var r=MakeRSV(
            sellerid: sellerid,
            sellerAcknowledgedAt: null;
        );

        Assert.Equal(Now,r.SellerAcknowledgedAt);
        Assert.Equal(Now+ReservationStateMachine.ResponseWindow,r.ExpiresAt);
    }

    //registerbuyerresponse
    [Fact]
    public void RegisterBuyerResponse_CallNotBuyer_ReturnFalse()
    {
        var buyer=Guid.NewGuid();
        //Assert.Equal()
        var rdmId=Guid.NewGuid();
        var r=MakeRSV(
            buyerId: buyer,
            sellerAcknowledgedAt:DateTime.Now.AddHours(-1)
        );

        var result=ReservationStateMachine.RegisterBuyerResponse(r,rdmId,DateTime.Now);
        Assert.False(result);
        Assert.Null(r.BuyerRespondedAt);
    }

    //
    [Fact]
    public void RegisterBuyerResponse_RSVnotActive_ReturnFalse()
    {
        var buyer=Guid.NewGuid();
        //Assert.Equal()
        var OGResponse=DateTime.Now.AddHours(-1);
        var r=MakeRSV(
            buyerId: buyer,
            sellerAcknowledgedAt:DateTime.Now.AddHours(-2),
            buyerRespondedAt: OGResponse
        );

        var result=ReservationStateMachine.RegisterBuyerResponse(r,OGResponse,DateTime.Now);
        Assert.False(result);
        Assert.Null(r.BuyerRespondedAt);
    }

    [Fact]
    public void RegisterBuyerResponse_SellerNotAcked_ReturnsFalse()
    {
        var buyer=Guid.NewGuid();
        //Assert.Equal()
        //var OGResponse=DateTime.Now.AddHours(-1);
        var r=MakeRSV(
            buyerId: buyer,
            sellerAcknowledgedAt:null
        );

        var result=ReservationStateMachine.RegisterBuyerResponse(r,buyer,DateTime.Now);
        Assert.False(result);
        Assert.Null(r.BuyerRespondedAt);
    }

    [Fact]
    public void RegisterBuyerResponse__BuyerAlreadyRespondedAt_ReturnFalse()
    {
        var buyer=Guid.NewGuid();
        //Assert.Equal()
        var OGResponse=DateTime.Now.AddHours(-1);
        var r=MakeRSV(
            buyerId: buyer,
            sellerAcknowledgedAt:DateTime.Now.AddHours(-2),
            buyerRespondedAt: OGResponse
        );

        var result=ReservationStateMachine.RegisterBuyerResponse(r,buyer,DateTime.Now);
        Assert.False(result);
        Assert.Equal(OGResponse,r.BuyerRespondedAt);
    }

    [Fact]
    public void RegisterBuyerResponse__Valid_SetRespondedAtExtendsExpiryReturnsTrue()
    {
        var buyer=Guid.NewGuid();
        //Assert.Equal()
        //var OGResponse=DateTime.Now.AddHours(-1);
        var r=MakeRSV(
            buyerId: buyer,
            sellerAcknowledgedAt:DateTime.Now.AddHours(-2),
            buyerRespondedAt: null
        );

        var result=ReservationStateMachine.RegisterBuyerResponse(r,buyer,DateTime.Now);
        Assert.True(result);
        Assert.Equal(DateTime.Now,r.BuyerRespondedAt);
        Assert.Equal(DateTime.Now + ReservationStateMachine.ResponseWindow,r.ExpiresAt);
    }

    //cancel
    [Fact]
    public void Cancel_StatusAlreadyTerminal_ThrowsAlreadyTerminal()
    {
        var buyerId=Guid.NewGuid();
        var r=MakeReservation(status:ReservationSTate.Cancelled,
        buyerId);

        Assert.Throws<ReservationException>(()=> ReservationStateMachine.Cancel(r,buyerId,DateTime.Now));
    }

    [Fact]
    public void Cancel_CallerIsbuyer_StatusBecomesCancelled()
    {
        var buyerId=Guid.NewGuid();
        var sellerId=Guid.NewGuid();
        var r=MakeReservation(
            buyerId:buyerId,
            sellerId:sellerId,
            sellerAcknowledgedAt:DateTime.Now.AddMinutes(-1)
        );

        ReservationStateMachine.Cancel(r,buyerId,DateTime.Now);
        Assert.Equal(ReservationState.Cancelled,r.ReservationStatus);
    }

    [Fact]
    public void Cancel_CallerIsSellerAndCanSellerRealeaseIsFalse_ThrowsReleaseTooEarly()
    {
        //var buyerId=Guid.NewGuid();
        var sellerId=Guid.NewGuid();
        var r=MakeReservation(
           // buyerId:buyerId,
            sellerId:sellerId,
            sellerAcknowledgedAt:DateTime.Now.AddMinutes(-1)
        );

        Assert.Throws<ReservationException>(()=> ReservationStateMachine.Cancel(r,sellerId,DateTime.Now));
    }

    [Fact]
    public void Cancel_CallerIsSellerAndCanSellerRealeaseIsTrue_StatusBecomesCancelled()
    {
        //var buyerId=Guid.NewGuid();
        var sellerId=Guid.NewGuid();
        var r=MakeReservation(
           // buyerId:buyerId,
            sellerId:sellerId,
            sellerAcknowledgedAt:DateTime.Now.AddMinutes(-12)
        );

        ReservationStateMachine.Cancel(r,sellerId,DateTime.Now);
        Assert.Equal(ReservationState.Cancelled,r.ReservationStatus);
    }

    [Fact]
    public void Cancel_CallerIsNorSellerNOrBuyer_ThrowsForbidden()
    {
        //var buyerId=Guid.NewGuid();
        //var sellerId=Guid.NewGuid();
        var r=MakeReservation(
           // buyerId:buyerId,
           // sellerId:sellerId,
            //sellerAcknowledgedAt:DateTime.Now.AddMinutes(-1)
        );
        var notVerifiedId=Guid.NewGuid();//essentially someoen who was not verfied cannot cancell

        Assert.Throws<ReservationException>(()=> ReservationStateMachine.Cancel(r,notVerifiedIdId,DateTime.Now));
    }

    //cansellerRelease the rsv
    [Fact]
    public void CanSellerRelease_NeverAcked_ReturnsTrue()
    {
        var r=MakeReservation(sellerAcknowledgedAt:null);
        Assert.True(ReservationStateMachine.CanSellerRelease(r,DateTime.Now));
    }

    [Fact]
    public void CanSellerRelease_BuyerRespondedisSet_ReturnsFalse()
    {
        var r=MakeReservation(buyerRespondedAt:DateTime.Now.AddHours(-1), sellerAcknowledgedAt:DateTime.Now.AddHours(-100));
        Assert.False(ReservationStateMachine.CanSellerRelease(r,DateTime.Now));
    }
    [Theory]
    [InlineData(12,0,true)]
    [InlineData(11,59,false)]
    [InlineData(12,1,true)]
    public void CanSellerRelease_TwelveHourBoundary(int hoursElapsed,int minutesElapsed,bool expected)
    {
        var elapsed=TimeSpan.FromHours(hoursElapsed)+TimeSpan.FromMinutes(minutesElapsed);
        var r=MakeReservation(buyerRespondedAt:null, sellerAcknowledgedAt:DateTime.Now-elapsed);

        var result=ReservationStateMachine.CanSellerRelease(r,DateTime.Now);

        Assert.Equal(expected,result);
    }

    //expired rsv
    [Fact]
    public void Expire_StatusAlreadyTerminal_ThrowsAlreadyTerminal()
    {
        var r=MakeReservation(status:ReservationStatus.Cancelled,expiresAt:DateTime.Now.AddHours(-1));
        Assert.Throws<ReservationEception>(()=> ReservationStateMachine.Expire(r,DateTime.Now));
    }

    [Fact]
    public void Expire_ExpiresInTheFuture_ThrowsNotYetExpired()
    {
        var r=MakeRSV(expiresAt:Now.AddMinutes(1));
        Assert.Throws<ReservationException>(()=>ReservationStateMachine.Expire(r, DateTime.Now));
    }

    [Fact]
    public void Expire_ExpiresAtExactlyNow_SucceedsAndStatusBecomesExpired()
    {
        var r=MakeRSV(expiresAt:DateTime.Now);
        ReservationStateMachine.Expire(r,DateTime.Now);
        Assert.Equal(ReservationState.Expired,r.ReservationStatus);
    }

    [Fact]
    public void Expire_ExpiresAtInThepast_StatusBecomesExpired()
    {
        var r=MakeRSV(expiresAt:DateTime.Now.AddMinutes(-1));
        Assert.Equal(ReservationState.Expired,r.ReservationStatus);
    }


    //confirmmeetup

    [Fact]
    public void ConfirmMeetup_ReservationNotActive_ThrowsNotActive()
    {
        var r=MakeRSV(status: ReservationState.Cancelled);

        Assert.Throws<ReservationException>(()=> ReservationStateMachine.ConfirmMeetup(r,DateTime.Now));
    }

    [Fact]
    public void ConfirmMeetup_AlreadyConfirmed_ThrowsMeetupAlreadyConfirmed()
    {
        var r=MakeRSV(meetupConfirmedAt:DateTime.Now.AddHours(-1));

        Assert.Throws<ReservationException>(()=>ReservationStateMachine.ConfirmMeetup(r,DateTIme.Now));
    }

    [Fact]
    public void ConfirmMeetup_ValidCall_SetsMeetupConfirmedAt()
    {
        var r=MakeRSV(meetupConfirmedAt:null);
        ReservationStateMachine.ConfirmMeetup(r,DateTime.Now);
        Assert.Equal(DateTIme.Now,r.MeetupConfirmedAt);
    }

    //istimerpaused
    [Fact]
    public void IsTimerPaused_MeetupConfirmedNull_ReturnsFalse()
    {
        var r=MakeRSV(meetupConfirmedAt:null);
        Assert.False(ReservationStateMachine.IsTimerPaused(r));
    }

    [Fact]
    public void IsTimerPaused_MeetupConfirmedSet_ReturnsTrue()
    {
        var r=MakeRSV(meetupConfirmedAt:DateTime.Now.AddMinutes(-5));
        Assert.True(ReservationStateMachine.IsTimerPaused(r));
    }


    










    




}
